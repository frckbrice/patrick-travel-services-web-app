// Firebase Chat Service for Backend
// Initializes and manages Firebase Realtime Database chat conversations

import { ref, set, update, get, push } from 'firebase/database';
import { database } from './firebase-client';
import { logger } from '@/lib/utils/logger';
import { setLogLevel } from 'firebase/app';

/**
 * Convert PostgreSQL user ID to Firebase UID via API route
 * This is needed for client-side code that can't use PrismaClient directly
 * For server-side code, use the helper function in API routes instead
 */
async function getFirebaseUidFromPostgresId(postgresId: string): Promise<string | null> {
  try {
    // Only call API if we're in a browser environment (client-side)
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/users/${postgresId}/firebase-uid`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.firebaseId || null;
      }
      logger.warn('Failed to get Firebase UID from API', { postgresId, status: response.status });
      return null;
    }
    // Server-side: This shouldn't be called from server-side code
    // Use the server-side helper function in API routes instead
    logger.error(
      'getFirebaseUidFromPostgresId called from server-side - use API route helper instead',
      { postgresId }
    );
    return null;
  } catch (error) {
    logger.error('Failed to get Firebase UID from PostgreSQL ID', error, { postgresId });
    return null;
  }
}

export interface ChatParticipants {
  clientId: string;
  clientName: string;
  agentId: string;
  agentName: string;
}

export interface CaseReference {
  caseId: string;
  caseReference: string;
  assignedAt: number;
}

export interface ChatMetadata {
  participants: ChatParticipants;
  caseReferences?: CaseReference[]; // Array of all cases for this client-agent pair
  createdAt: number;
  lastMessage: string | null;
  lastMessageTime: number | null;
  updatedAt?: number;
}

/**
 * Generate deterministic chat room ID from client-agent pair
 * Always sorts IDs alphabetically to ensure consistency
 */
function getChatRoomId(clientId: string, agentId: string): string {
  const sorted = [clientId, agentId].sort();
  return `${sorted[0]}-${sorted[1]}`;
}

/**
 * Initialize a Firebase chat conversation when a case is assigned to an agent
 * This creates the chat room structure in Firebase Realtime Database
 *
 * NOTE: clientId and agentId should be Firebase UIDs, not PostgreSQL IDs
 * This is required for Firebase security rules to work correctly
 */
export async function initializeFirebaseChat(
  caseId: string,
  caseReference: string,
  clientId: string, // Should be Firebase UID
  clientName: string,
  agentId: string, // Should be Firebase UID
  agentName: string
): Promise<void> {
  try {
    // Use client-agent pair for room ID instead of caseId
    const chatRoomId = getChatRoomId(clientId, agentId);
    const conversationRef = ref(database, `chats/${chatRoomId}/metadata`);

    // Check if conversation already exists
    const snapshot = await get(conversationRef);

    if (snapshot.exists()) {
      // Chat room exists - add this case to the caseReferences array if not already present
      const existingData = snapshot.val();
      const caseRefs = existingData.caseReferences || [];

      // Check if this case is already in the array
      const caseExists = caseRefs.some((ref: CaseReference) => ref.caseId === caseId);

      if (!caseExists) {
        // Add new case to the array
        const updatedCaseRefs = [
          ...caseRefs,
          {
            caseId,
            caseReference,
            assignedAt: Date.now(),
          },
        ];

        await update(conversationRef, {
          caseReferences: updatedCaseRefs,
          updatedAt: Date.now(),
        });

        logger.info('Added case to existing chat room', {
          caseId,
          caseReference,
          chatRoomId,
          totalCases: updatedCaseRefs.length,
        });
      } else {
        logger.info('Case already exists in chat room', {
          caseId,
          chatRoomId,
        });
      }

      // Update participants if agent changed (reassignment case)
      const needsParticipantUpdate =
        existingData.participants?.agentId !== agentId ||
        existingData.participants?.agentName !== agentName;

      if (needsParticipantUpdate) {
        await update(conversationRef, {
          participants: {
            clientId,
            clientName,
            agentId,
            agentName,
          },
          updatedAt: Date.now(),
        });

        logger.info('Firebase chat updated with new agent', {
          caseId,
          chatRoomId,
          oldAgent: existingData.participants?.agentId?.substring(0, 8),
          newAgent: agentId.substring(0, 8),
        });
      }
    } else {
      // Create new conversation with this case
      const chatMetadata: ChatMetadata = {
        participants: {
          clientId,
          clientName,
          agentId,
          agentName,
        },
        caseReferences: [
          {
            caseId,
            caseReference,
            assignedAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        lastMessage: null,
        lastMessageTime: null,
      };

      await set(conversationRef, chatMetadata);

      // 🆕 Create userChats index entries
      // Note: clientId and agentId are already Firebase UIDs here
      if (agentId && clientId) {
        await Promise.all([
          set(ref(database, `userChats/${agentId}/${chatRoomId}`), {
            chatId: chatRoomId,
            participantName: clientName,
            lastMessage: null,
            lastMessageTime: null,
          }),
          set(ref(database, `userChats/${clientId}/${chatRoomId}`), {
            chatId: chatRoomId,
            participantName: agentName,
            lastMessage: null,
            lastMessageTime: null,
          }),
        ]);
        logger.info('userChats entries created during initialization', {
          chatRoomId,
        });
      } else {
        logger.warn('Could not create userChats entries - missing Firebase UIDs', {
          chatRoomId,
          agentId: agentId?.substring(0, 8) + '...',
          clientId: clientId?.substring(0, 8) + '...',
        });
      }

      logger.info('Firebase chat initialized', {
        caseId,
        caseReference,
        chatRoomId,
        clientId: clientId.substring(0, 8) + '...',
        agentId: agentId.substring(0, 8) + '...',
        action: 'create',
      });
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase chat', error, {
      caseId,
      clientId,
      agentId,
    });
    // Don't throw - chat initialization failure shouldn't block case assignment
  }
}

/**
 * Send initial welcome message from agent to client
 * This can be triggered automatically when case is assigned
 */
export async function sendWelcomeMessage(
  caseId: string,
  agentId: string, // Should be Firebase UID
  agentName: string,
  clientName: string,
  caseReference: string,
  clientId: string // Should be Firebase UID - NEW PARAMETER
): Promise<void> {
  try {
    // Use client-agent pair for room ID instead of caseId
    const chatRoomId = getChatRoomId(clientId, agentId);

    const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
    const welcomeMessageRef = ref(database, `chats/${chatRoomId}/messages/${Date.now()}`);

    const welcomeMessage = {
      caseId,
      senderId: agentId, // Using Firebase UID
      senderName: agentName,
      content: `Hello ${clientName.split(' ')[0]}, I'm ${agentName}, your advisor for case ${caseReference}. I've reviewed your case and I'm here to help. Feel free to ask any questions!`,
      sentAt: Date.now(),
      isRead: false,
    };

    await set(welcomeMessageRef, welcomeMessage);

    // Update conversation metadata
    const metadataRef = ref(database, `chats/${chatRoomId}/metadata`);
    await update(metadataRef, {
      lastMessage: welcomeMessage.content.substring(0, 100),
      lastMessageTime: Date.now(),
      updatedAt: Date.now(),
    });

    logger.info('Welcome message sent', {
      caseId,
      caseReference,
      chatRoomId,
      agentId: agentId.substring(0, 8) + '...',
    });
  } catch (error) {
    logger.error('Failed to send welcome message', error);
    // Don't throw - welcome message is optional
  }
}

/**
 * Update agent information in existing conversation
 * Useful when reassigning cases to different agents
 *
 * NOTE: This function will create a NEW chat room for the new agent-client pair
 * and migrate messages if needed. Old chat room remains for history.
 */
export async function updateChatAgent(
  caseId: string,
  clientId: string, // Firebase UID
  newAgentId: string, // Firebase UID
  newAgentName: string,
  caseReference: string
): Promise<void> {
  try {
    // Create new chat room for new agent-client pair
    const oldChatRoomId = getChatRoomId(clientId, 'old-agent-will-be-updated'); // Not accurate, but we need to find the old room first
    const newChatRoomId = getChatRoomId(clientId, newAgentId);

    // For now, we'll just update the existing room
    // This is a simplified version - in production you'd want to:
    // 1. Create new room with new agent
    // 2. Keep old room for history
    // 3. Update caseReferences to point to both rooms

    // Find all chat rooms that contain this client
    const chatsRef = ref(database, 'chats');
    const snapshot = await get(chatsRef);

    let updated = false;

    snapshot.forEach((childSnapshot) => {
      const metadata = childSnapshot.val()?.metadata;
      if (metadata?.participants?.clientId === clientId) {
        const chatRoomId = childSnapshot.key!;

        // Check if this room has cases that include our caseId
        const caseRefs = metadata.caseReferences || [];
        const hasCase = caseRefs.some((ref: CaseReference) => ref.caseId === caseId);

        if (hasCase) {
          // Update participants
          const participantsRef = ref(database, `chats/${chatRoomId}/metadata/participants`);

          update(participantsRef, {
            agentId: newAgentId,
            agentName: newAgentName,
          });

          updated = true;
          logger.info('Chat agent updated in existing room', {
            caseId,
            caseReference,
            chatRoomId,
            newAgentId: newAgentId.substring(0, 8) + '...',
          });
        }
      }
    });

    if (!updated) {
      logger.warn('Could not find existing chat room to update agent', { caseId, clientId });
    }
  } catch (error) {
    logger.error('Failed to update chat agent', error);
    throw error;
  }
}

/**
 * Delete a chat conversation
 * Should only be called when a case is permanently deleted
 * Automatically cleans up userChats entries for both participants
 */
export async function deleteFirebaseChat(caseId: string): Promise<void> {
  try {
    const chatRef = ref(database, `chats/${caseId}`);
    const metadataRef = ref(database, `chats/${caseId}/metadata`);

    // 1) Get participants so we know which userChats to remove
    const metadataSnap = await get(metadataRef);
    if (!metadataSnap.exists()) {
      logger.warn('Chat metadata not found, skipping userChats cleanup', { caseId });
      await set(chatRef, null);
      return;
    }

    const participants = metadataSnap.val()?.participants;
    const { agentId, clientId } = participants || {};

    // 2) Remove chat node
    await set(chatRef, null);

    // 3) Remove entries from userChats for both participants
    if (agentId && clientId) {
      // Metadata participants should already be Firebase UIDs (per initialization logic)
      // Try direct access first, then convert if permission is denied
      try {
        await Promise.all([
          set(ref(database, `userChats/${agentId}/${caseId}`), null),
          set(ref(database, `userChats/${clientId}/${caseId}`), null),
        ]);
        logger.info('Firebase chat and userChats entries deleted', { caseId, agentId, clientId });
      } catch (deleteError: any) {
        // If access fails, the IDs might be PostgreSQL IDs - try to convert and retry
        if (deleteError?.code === 'PERMISSION_DENIED') {
          logger.warn('userChats delete failed, attempting ID conversion', {
            caseId,
            agentId: agentId.substring(0, 8) + '...',
            clientId: clientId.substring(0, 8) + '...',
          });

          const agentFirebaseUid = await getFirebaseUidFromPostgresId(agentId);
          const clientFirebaseUid = await getFirebaseUidFromPostgresId(clientId);

          if (agentFirebaseUid && clientFirebaseUid) {
            await Promise.all([
              set(ref(database, `userChats/${agentFirebaseUid}/${caseId}`), null),
              set(ref(database, `userChats/${clientFirebaseUid}/${caseId}`), null),
            ]);
            logger.info('Firebase chat and userChats entries deleted after ID conversion', {
              caseId,
            });
          } else {
            logger.warn('Could not delete userChats entries - conversion failed', {
              caseId,
              agentId: agentId.substring(0, 8) + '...',
              clientId: clientId.substring(0, 8) + '...',
            });
          }
        } else {
          throw deleteError;
        }
      }
    } else {
      logger.warn('Missing participant IDs during deletion', { caseId, participants });
    }
  } catch (error) {
    logger.error('Failed to delete Firebase chat or clean up userChats', error, { caseId });
    throw error;
  }
}

/**
 * Send a message in a chat room
 * Used for client-side direct Firebase messaging
 */
export interface SendMessageParams {
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole?: 'AGENT' | 'CLIENT'; // Role of the sender
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole?: 'AGENT' | 'CLIENT'; // Role of the recipient
  content: string;
  caseId?: string;
  subject?: string;
  attachments?: any[];
}

export async function sendMessage(params: SendMessageParams): Promise<string> {
  try {
    logger.info('sendMessage called with params', {
      hasCaseId: !!params.caseId,
      senderId: params.senderId.substring(0, 8) + '...',
      recipientId: params.recipientId.substring(0, 8) + '...',
      contentLength: params.content.length,
    });

    // Debug Firebase auth state
    const { auth } = await import('./firebase-client');
    logger.info('Firebase auth state', {
      currentUser: auth.currentUser?.uid ? auth.currentUser.uid.substring(0, 8) + '...' : 'null',
      email: auth.currentUser?.email || 'null',
    });

    setLogLevel('debug');

    // Determine chat room ID using client-agent pair (deterministic, sorted)
    // We need to identify who is client and who is agent
    let clientId: string;
    let agentId: string;

    if (params.senderRole && params.recipientRole) {
      // Use explicit roles if provided
      if (params.senderRole === 'CLIENT') {
        clientId = params.senderId;
        agentId = params.recipientId;
      } else {
        clientId = params.recipientId;
        agentId = params.senderId;
      }
    } else {
      // Fallback: Order alphabetically and assume first is client
      const orderedIds = [params.senderId, params.recipientId].sort();
      clientId = orderedIds[0];
      agentId = orderedIds[1];
    }

    // Use client-agent pair for deterministic room ID
    const chatRoomId = getChatRoomId(clientId, agentId);

    logger.info('Chat room ID determined', {
      chatRoomId: chatRoomId.substring(0, 12) + '...',
      hasCaseId: !!params.caseId,
    });

    // MIGRATION: If caseId is provided, check if old format chat exists and migrate it
    if (params.caseId && chatRoomId !== params.caseId) {
      // Check if old format chat exists (caseId used as room ID)
      const oldFormatRef = ref(database, `chats/${params.caseId}/metadata`);
      const oldFormatSnapshot = await get(oldFormatRef);

      if (oldFormatSnapshot.exists()) {
        logger.info('Detected old format chat room, attempting migration', {
          caseId: params.caseId,
          oldRoomId: params.caseId,
          newRoomId: chatRoomId.substring(0, 12) + '...',
        });

        // Check if new format room already exists
        const newFormatRef = ref(database, `chats/${chatRoomId}/metadata`);
        const newFormatSnapshot = await get(newFormatRef);

        if (
          !newFormatSnapshot.exists() ||
          (oldFormatSnapshot.exists() && newFormatSnapshot.exists())
        ) {
          // Migrate: Use consolidate function to merge old into new
          try {
            // consolidateChatConversations is defined in this file, so we can call it directly
            await consolidateChatConversations(params.caseId, params.caseId, chatRoomId);
            logger.info('Successfully migrated old chat to new format', {
              caseId: params.caseId,
              newRoomId: chatRoomId.substring(0, 12) + '...',
            });
          } catch (migrateError: any) {
            // Migration failed - log but continue (non-critical)
            logger.warn(
              'Failed to auto-migrate old chat (non-critical, continuing with new format)',
              {
                caseId: params.caseId,
                error: migrateError?.message,
              }
            );
          }
        }
      }
    }

    const timestamp = Date.now();

    // Use push() to generate unique IDs automatically - prevents collisions
    const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key!;
    const messageRef = newMessageRef;

    const message = {
      id: messageId,
      senderId: params.senderId,
      senderName: params.senderName,
      content: params.content,
      sentAt: timestamp,
      isRead: false, // Default to unread
      caseId: params.caseId, // Optional: for context filtering
      attachments: params.attachments || [],
    };

    logger.info('Attempting to write message to Firebase', {
      path: `chats/${chatRoomId}/messages/${messageId}`,
    });

    // CRITICAL: Ensure metadata exists before writing message
    // Firebase read rules require metadata to check permissions
    const metadataRef = ref(database, `chats/${chatRoomId}/metadata`);
    const existingMetadata = await get(metadataRef);

    if (!existingMetadata.exists()) {
      logger.info('Creating chat room metadata');

      // Now we need to get clientName and agentName
      let clientName: string;
      let agentName: string;

      if (params.senderRole && params.recipientRole) {
        // Use explicit roles if provided
        if (params.senderRole === 'CLIENT') {
          clientName = params.senderName;
          agentName = params.recipientName;
        } else {
          clientName = params.recipientName;
          agentName = params.senderName;
        }
      } else {
        // Fallback: Use names based on ID ordering
        const orderedIds = [params.senderId, params.recipientId].sort();
        clientName = orderedIds[0] === params.senderId ? params.senderName : params.recipientName;
        agentName = orderedIds[1] === params.senderId ? params.senderName : params.recipientName;
      }

      // Build caseReferences array if caseId is provided
      const caseReferences = params.caseId
        ? [
            {
              caseId: params.caseId,
              caseReference: params.caseId, // Could get actual reference if available
              assignedAt: timestamp,
            },
          ]
        : [];

      const metadataData: ChatMetadata = {
        participants: {
          clientId,
          clientName,
          agentId,
          agentName,
        },
        caseReferences,
        createdAt: timestamp,
        lastMessage: params.content.substring(0, 100),
        lastMessageTime: timestamp,
      };

      logger.info('Creating metadata with participants', {
        clientId: clientId.substring(0, 8) + '...',
        clientName,
        agentId: agentId.substring(0, 8) + '...',
        agentName,
        chatRoomId: chatRoomId.substring(0, 12) + '...',
        hasCase: !!params.caseId,
      });

      try {
        await set(metadataRef, metadataData);

        // 🆕 Ensure userChats index is created
        // Note: clientId and agentId are already Firebase UIDs at this point
        if (agentId && clientId) {
          await Promise.all([
            set(ref(database, `userChats/${agentId}/${chatRoomId}`), {
              chatId: chatRoomId,
              participantName: clientName,
              lastMessage: params.content.substring(0, 100),
              lastMessageTime: timestamp,
            }),
            set(ref(database, `userChats/${clientId}/${chatRoomId}`), {
              chatId: chatRoomId,
              participantName: agentName,
              lastMessage: params.content.substring(0, 100),
              lastMessageTime: timestamp,
            }),
          ]);
          logger.info('userChats entries created successfully');
        } else {
          logger.warn('Could not create userChats entries - missing Firebase UIDs', {
            agentId: agentId?.substring(0, 8) + '...',
            clientId: clientId?.substring(0, 8) + '...',
          });
        }
        logger.info('Chat room metadata created successfully');
      } catch (metadataError: any) {
        logger.error('Failed to create metadata', {
          error: metadataError?.message,
          code: metadataError?.code,
          chatRoomId: chatRoomId.substring(0, 12) + '...',
        });
        throw metadataError;
      }
    } else {
      // Update metadata with new last message
      logger.info('Updating chat room metadata');
      const currentData = existingMetadata.val();
      try {
        // Need to include participants in update for Firebase rules to pass
        await update(metadataRef, {
          participants: currentData.participants,
          lastMessage: params.content.substring(0, 100),
          lastMessageTime: timestamp,
        });

        // 🆕 Update both participants' userChats entries
        // Metadata participants should already be Firebase UIDs (per initialization logic)
        // If they're not, the Firebase rules will prevent access, so we use them directly
        const agentFirebaseUid = currentData.participants.agentId;
        const clientFirebaseUid = currentData.participants.clientId;

        if (agentFirebaseUid && clientFirebaseUid) {
          try {
            await Promise.all([
              update(ref(database, `userChats/${agentFirebaseUid}/${chatRoomId}`), {
                lastMessage: params.content.substring(0, 100),
                lastMessageTime: timestamp,
              }),
              update(ref(database, `userChats/${clientFirebaseUid}/${chatRoomId}`), {
                lastMessage: params.content.substring(0, 100),
                lastMessageTime: timestamp,
              }),
            ]);
            logger.info('userChats entries updated successfully');
          } catch (userChatsError: any) {
            // If access fails, the IDs might be PostgreSQL IDs - try to convert and retry
            if (userChatsError?.code === 'PERMISSION_DENIED') {
              logger.warn('userChats update failed, attempting ID conversion', {
                agentId: agentFirebaseUid.substring(0, 8) + '...',
                clientId: clientFirebaseUid.substring(0, 8) + '...',
              });

              const convertedAgentId = await getFirebaseUidFromPostgresId(agentFirebaseUid);
              const convertedClientId = await getFirebaseUidFromPostgresId(clientFirebaseUid);

              if (convertedAgentId && convertedClientId) {
                await Promise.all([
                  update(ref(database, `userChats/${convertedAgentId}/${chatRoomId}`), {
                    lastMessage: params.content.substring(0, 100),
                    lastMessageTime: timestamp,
                  }),
                  update(ref(database, `userChats/${convertedClientId}/${chatRoomId}`), {
                    lastMessage: params.content.substring(0, 100),
                    lastMessageTime: timestamp,
                  }),
                ]);
                logger.info('userChats entries updated successfully after ID conversion');
              } else {
                logger.warn('Could not update userChats entries - conversion failed', {
                  agentId: agentFirebaseUid.substring(0, 8) + '...',
                  clientId: clientFirebaseUid.substring(0, 8) + '...',
                });
              }
            } else {
              throw userChatsError;
            }
          }
        } else {
          logger.warn('Could not update userChats entries - missing participant IDs', {
            agentId: agentFirebaseUid?.substring(0, 8) + '...' || 'null',
            clientId: clientFirebaseUid?.substring(0, 8) + '...' || 'null',
          });
        }
        logger.info('Chat room metadata updated successfully');
      } catch (metaUpdateError: any) {
        // This is non-critical - message can still be written
        logger.warn('Metadata update failed (non-critical)', {
          error: metaUpdateError?.message,
        });
      }
    }

    // Now write the message
    logger.info('Writing message to Firebase');

    try {
      await set(messageRef, message);
      logger.info('Message successfully written to Firebase', { messageId });
    } catch (writeError: any) {
      logger.error('Failed to write message to Firebase', {
        error: writeError?.message,
        code: writeError?.code,
        stack: writeError?.stack,
        chatRoomId: chatRoomId.substring(0, 12) + '...',
        messageId,
        senderId: params.senderId.substring(0, 8) + '...',
      });
      throw writeError;
    }

    logger.info('Message sent via Firebase successfully', {
      chatRoomId: chatRoomId.substring(0, 12) + '...',
      messageId,
    });
    return messageId;
  } catch (error: any) {
    logger.error('Failed to send message to Firebase', {
      error: error?.message,
      code: error?.code,
      chatRoomId:
        params.caseId ||
        [params.senderId, params.recipientId].sort().join('-').substring(0, 12) + '...',
    });
    throw error;
  }
}

export interface ChatRoom {
  id?: string;
  participants:
    | Record<string, boolean>
    | Record<string, { id: string; name: string; email: string }>;
  caseId?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount?: Record<string, number>;
  createdAt?: number;
  updatedAt?: number;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  content: string;
  sentAt: number;
  isRead?: boolean;
  attachments?: any[];
}

/**
 * Consolidate two chat conversations for two cases
 * Merges messages from source room into target room and updates caseReferences
 *
 * HOW IT WORKS:
 * 1. Chat rooms are identified by client-agent pairs (not case IDs)
 * 2. Each room can contain multiple cases via caseReferences array
 * 3. Messages have optional caseId field for context
 * 4. If two cases share the same client-agent pair, they should be in ONE room
 *
 * This function:
 * - Finds both chat rooms (by caseId or roomId)
 * - Merges all messages from source into target
 * - Combines caseReferences arrays (removes duplicates)
 * - Preserves message order by timestamp
 * - Updates metadata and userChats indexes
 * - Cleans up the source room
 *
 * @param caseId1 - First case ID to consolidate
 * @param caseId2 - Second case ID to consolidate
 * @param targetRoomId - Optional: specific room ID to use as target. If not provided, uses the room with client-agent pair format
 * @returns Promise with consolidation result
 */
export async function consolidateChatConversations(
  caseId1: string,
  caseId2: string,
  targetRoomId?: string
): Promise<{ success: boolean; targetRoomId: string; messagesMerged: number; casesAdded: number }> {
  try {
    logger.info('Starting chat conversation consolidation', { caseId1, caseId2, targetRoomId });

    const chatsRef = ref(database, 'chats');
    const snapshot = await get(chatsRef);

    if (!snapshot.exists()) {
      throw new Error('No chat rooms found in database');
    }

    interface RoomData {
      id: string;
      metadata: ChatMetadata;
      messages?: Record<string, any>;
    }

    let room1: RoomData | null = null;
    let room2: RoomData | null = null;

    // Find both rooms by searching through all chats
    snapshot.forEach((childSnapshot) => {
      const roomId = childSnapshot.key!;
      const metadata = childSnapshot.child('metadata').val();
      const messagesSnap = childSnapshot.child('messages');

      if (!metadata) return;

      const caseRefs = metadata.caseReferences || [];
      const hasCase1 = caseRefs.some((ref: CaseReference) => ref.caseId === caseId1);
      const hasCase2 = caseRefs.some((ref: CaseReference) => ref.caseId === caseId2);

      // Get messages if they exist
      const messages: Record<string, any> = {};
      if (messagesSnap.exists()) {
        messagesSnap.forEach((msgSnap) => {
          messages[msgSnap.key!] = msgSnap.val();
        });
      }

      if (hasCase1 && !room1) {
        room1 = { id: roomId, metadata, messages };
      }
      if (hasCase2 && !room2) {
        room2 = { id: roomId, metadata, messages };
      }
    });

    if (!room1) {
      throw new Error(`No chat room found for case ${caseId1}`);
    }
    if (!room2) {
      throw new Error(`No chat room found for case ${caseId2}`);
    }

    // TypeScript now knows room1 and room2 are non-null after the throws above
    const room1Final = room1 as RoomData;
    const room2Final = room2 as RoomData;

    // If they're already the same room, nothing to do
    if (room1Final.id === room2Final.id) {
      logger.info('Both cases already in the same chat room', {
        roomId: room1Final.id,
        caseId1,
        caseId2,
      });
      return {
        success: true,
        targetRoomId: room1Final.id,
        messagesMerged: 0,
        casesAdded: 0,
      };
    }

    // Determine target and source rooms
    let targetRoom: RoomData;
    let sourceRoom: RoomData;

    if (targetRoomId) {
      // Use specified target room
      if (room1Final.id === targetRoomId) {
        targetRoom = room1Final;
        sourceRoom = room2Final;
      } else if (room2Final.id === targetRoomId) {
        targetRoom = room2Final;
        sourceRoom = room1Final;
      } else {
        throw new Error(`Target room ${targetRoomId} does not contain either case`);
      }
    } else {
      // Prefer room with client-agent pair format (targetRoomId format: "clientId-agentId")
      // This is the standard format and will be maintained going forward
      const isRoom1Standard = /^[^-]+-[^-]+$/.test(room1Final.id) && room1Final.id.includes('-');
      const isRoom2Standard = /^[^-]+-[^-]+$/.test(room2Final.id) && room2Final.id.includes('-');

      if (isRoom1Standard && !isRoom2Standard) {
        targetRoom = room1Final;
        sourceRoom = room2Final;
      } else if (isRoom2Standard && !isRoom1Standard) {
        targetRoom = room2Final;
        sourceRoom = room1Final;
      } else {
        // Both or neither are standard format - use the one with more messages (more complete)
        const room1MsgCount = Object.keys(room1Final.messages || {}).length;
        const room2MsgCount = Object.keys(room2Final.messages || {}).length;
        if (room1MsgCount >= room2MsgCount) {
          targetRoom = room1Final;
          sourceRoom = room2Final;
        } else {
          targetRoom = room2Final;
          sourceRoom = room1Final;
        }
      }
    }

    logger.info('Identified target and source rooms', {
      targetRoomId: targetRoom.id,
      sourceRoomId: sourceRoom.id,
      targetMessages: Object.keys(targetRoom.messages || {}).length,
      sourceMessages: Object.keys(sourceRoom.messages || {}).length,
    });

    // 1. Merge caseReferences
    const targetCaseRefs = targetRoom.metadata.caseReferences || [];
    const sourceCaseRefs = sourceRoom.metadata.caseReferences || [];

    // Create a map to avoid duplicates
    const caseRefMap = new Map<string, CaseReference>();
    targetCaseRefs.forEach((ref: CaseReference) => {
      caseRefMap.set(ref.caseId, ref);
    });
    sourceCaseRefs.forEach((ref: CaseReference) => {
      // Only add if not already present
      if (!caseRefMap.has(ref.caseId)) {
        caseRefMap.set(ref.caseId, ref);
      }
    });

    const mergedCaseRefs = Array.from(caseRefMap.values());

    // 2. Merge messages from source into target
    const targetMessagesRef = ref(database, `chats/${targetRoom.id}/messages`);
    const sourceMessages = sourceRoom.messages || {};
    let messagesMerged = 0;

    // Sort messages by timestamp to maintain chronological order
    const sortedSourceMessages = Object.entries(sourceMessages).sort(
      ([_, msg1]: [string, any], [__, msg2]: [string, any]) => {
        return (msg1.sentAt || msg1.createdAt || 0) - (msg2.sentAt || msg2.createdAt || 0);
      }
    );

    for (const [messageId, message] of sortedSourceMessages) {
      try {
        // Use push() to generate new unique ID or use original timestamp-based ID
        // Prefer keeping original ID to preserve message references
        const messageRef = ref(database, `chats/${targetRoom.id}/messages/${messageId}`);

        // Check if message already exists in target
        const existingMsg = await get(messageRef);
        if (!existingMsg.exists()) {
          await set(messageRef, message);
          messagesMerged++;
        }
      } catch (error: any) {
        logger.warn('Failed to merge individual message, continuing...', {
          messageId,
          error: error?.message,
        });
        // Continue with other messages
      }
    }

    // 3. Update target room metadata
    const targetMetadataRef = ref(database, `chats/${targetRoom.id}/metadata`);

    // Determine latest message info
    const allMessages = {
      ...(targetRoom.messages || {}),
      ...sourceMessages,
    };

    let latestMessage: any = null;
    let latestTime = 0;

    Object.values(allMessages).forEach((msg: any) => {
      const msgTime = msg.sentAt || msg.createdAt || 0;
      if (msgTime > latestTime) {
        latestTime = msgTime;
        latestMessage = msg;
      }
    });

    await update(targetMetadataRef, {
      caseReferences: mergedCaseRefs,
      lastMessage: latestMessage?.content?.substring(0, 100) || targetRoom.metadata.lastMessage,
      lastMessageTime: latestTime || targetRoom.metadata.lastMessageTime,
      updatedAt: Date.now(),
      // Preserve original createdAt
      createdAt: targetRoom.metadata.createdAt,
    });

    // 4. Update userChats indexes for both participants
    const participants = targetRoom.metadata.participants;
    if (participants?.clientId && participants?.agentId) {
      const updatePromises = [
        update(ref(database, `userChats/${participants.clientId}/${targetRoom.id}`), {
          lastMessage: latestMessage?.content?.substring(0, 100) || targetRoom.metadata.lastMessage,
          lastMessageTime: latestTime || targetRoom.metadata.lastMessageTime,
        }),
        update(ref(database, `userChats/${participants.agentId}/${targetRoom.id}`), {
          lastMessage: latestMessage?.content?.substring(0, 100) || targetRoom.metadata.lastMessage,
          lastMessageTime: latestTime || targetRoom.metadata.lastMessageTime,
        }),
      ];

      await Promise.all(updatePromises).catch((error) => {
        logger.warn('Failed to update userChats indexes (non-critical)', { error: error?.message });
      });
    }

    // 5. Clean up source room
    const sourceRoomRef = ref(database, `chats/${sourceRoom.id}`);
    await set(sourceRoomRef, null);

    // Clean up source room from userChats indexes
    if (sourceRoom.metadata.participants?.clientId && sourceRoom.metadata.participants?.agentId) {
      try {
        await Promise.all([
          set(
            ref(
              database,
              `userChats/${sourceRoom.metadata.participants.clientId}/${sourceRoom.id}`
            ),
            null
          ),
          set(
            ref(database, `userChats/${sourceRoom.metadata.participants.agentId}/${sourceRoom.id}`),
            null
          ),
        ]);
      } catch (error: any) {
        logger.warn('Failed to clean up source userChats entries (non-critical)', {
          error: error?.message,
        });
      }
    }

    const casesAdded = mergedCaseRefs.length - targetCaseRefs.length;

    logger.info('Chat conversation consolidation completed successfully', {
      targetRoomId: targetRoom.id,
      sourceRoomId: sourceRoom.id,
      messagesMerged,
      casesAdded,
      totalCases: mergedCaseRefs.length,
    });

    return {
      success: true,
      targetRoomId: targetRoom.id,
      messagesMerged,
      casesAdded,
    };
  } catch (error) {
    logger.error('Failed to consolidate chat conversations', error, {
      caseId1,
      caseId2,
      targetRoomId,
    });
    throw error;
  }
}

/**
 * Mark messages as read for a specific user in a chat
 * Client-side function to mark all unread messages as read
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  try {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      logger.info('No messages found to mark as read', { chatId });
      return;
    }

    const updatePromises: Promise<void>[] = [];

    snapshot.forEach((msgSnap) => {
      const msg = msgSnap.val();
      // Only mark messages as read if they weren't sent by the current user and aren't already read
      if (msg.senderId !== userId && !msg.isRead) {
        const messageRef = ref(database, `chats/${chatId}/messages/${msgSnap.key}`);
        updatePromises.push(
          update(messageRef, { isRead: true }).catch((err) => {
            if (err.code !== 'PERMISSION_DENIED') {
              logger.error('Failed to mark message as read', err, {
                chatId,
                messageId: msgSnap.key,
                userId,
              });
            }
          })
        );
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      logger.info('Messages marked as read', {
        chatId,
        userId,
        count: updatePromises.length,
      });
    }
  } catch (error) {
    logger.error('Failed to mark messages as read', error, { chatId, userId });
    throw error;
  }
}
