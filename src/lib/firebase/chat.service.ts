// Firebase Chat Service for Backend
// Initializes and manages Firebase Realtime Database chat conversations

import { ref, set, update, get, push } from 'firebase/database';
import { database } from './firebase-client';
import { logger } from '@/lib/utils/logger';
import { setLogLevel } from 'firebase/app';
import { prisma } from '@/lib/db/prisma';

/**
 * Convert PostgreSQL user ID to Firebase UID
 * This is needed because userChats requires Firebase UIDs for security rules
 */
async function getFirebaseUidFromPostgresId(postgresId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: postgresId },
      select: { firebaseId: true },
    });
    return user?.firebaseId || null;
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
      // Convert PostgreSQL IDs to Firebase UIDs for userChats access
      const agentFirebaseUid = await getFirebaseUidFromPostgresId(agentId);
      const clientFirebaseUid = await getFirebaseUidFromPostgresId(clientId);

      if (agentFirebaseUid && clientFirebaseUid) {
        await Promise.all([
          set(ref(database, `userChats/${agentFirebaseUid}/${caseId}`), null),
          set(ref(database, `userChats/${clientFirebaseUid}/${caseId}`), null),
        ]);
        logger.info('Firebase chat and userChats entries deleted', { caseId, agentId, clientId });
      } else {
        logger.warn('Could not delete userChats entries - missing Firebase UIDs', {
          caseId,
          agentId: agentId.substring(0, 8) + '...',
          clientId: clientId.substring(0, 8) + '...',
          agentFirebaseUid: agentFirebaseUid?.substring(0, 8) + '...' || 'null',
          clientFirebaseUid: clientFirebaseUid?.substring(0, 8) + '...' || 'null',
        });
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
        // Convert PostgreSQL IDs to Firebase UIDs for userChats access
        const agentFirebaseUid = await getFirebaseUidFromPostgresId(
          currentData.participants.agentId
        );
        const clientFirebaseUid = await getFirebaseUidFromPostgresId(
          currentData.participants.clientId
        );

        if (agentFirebaseUid && clientFirebaseUid) {
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
        } else {
          logger.warn('Could not update userChats entries - missing Firebase UIDs', {
            agentId: currentData.participants.agentId?.substring(0, 8) + '...',
            clientId: currentData.participants.clientId?.substring(0, 8) + '...',
            agentFirebaseUid: agentFirebaseUid?.substring(0, 8) + '...' || 'null',
            clientFirebaseUid: clientFirebaseUid?.substring(0, 8) + '...' || 'null',
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
