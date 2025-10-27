// Firebase Chat Service for Backend
// Initializes and manages Firebase Realtime Database chat conversations

import { ref, set, update, get, push } from 'firebase/database';
import { database } from './firebase-client';
import { logger } from '@/lib/utils/logger';
import { setLogLevel } from 'firebase/app';

export interface ChatParticipants {
  clientId: string;
  clientName: string;
  agentId: string;
  agentName: string;
}

export interface ChatMetadata {
  caseReference: string;
  participants: ChatParticipants;
  createdAt: number;
  lastMessage: string | null;
  lastMessageTime: number | null;
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
    const conversationRef = ref(database, `chats/${caseId}/metadata`);

    // Check if conversation already exists
    const snapshot = await get(conversationRef);

    if (snapshot.exists()) {
      // Update existing conversation with new agent info
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
        clientId,
        agentId,
        action: 'update',
      });
    } else {
      // Create new conversation
      const chatMetadata: ChatMetadata = {
        caseReference,
        participants: {
          clientId,
          clientName,
          agentId,
          agentName,
        },
        createdAt: Date.now(),
        lastMessage: null,
        lastMessageTime: null,
      };

      await set(conversationRef, chatMetadata);

      logger.info('Firebase chat initialized', {
        caseId,
        clientId,
        agentId,
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
  caseReference: string
): Promise<void> {
  try {
    const messagesRef = ref(database, `chats/${caseId}/messages`);
    const welcomeMessageRef = ref(database, `chats/${caseId}/messages/${Date.now()}`);

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
    const metadataRef = ref(database, `chats/${caseId}/metadata`);
    await update(metadataRef, {
      lastMessage: welcomeMessage.content.substring(0, 100),
      lastMessageTime: Date.now(),
    });

    logger.info('Welcome message sent', { caseId, agentId });
  } catch (error) {
    logger.error('Failed to send welcome message', error);
    // Don't throw - welcome message is optional
  }
}

/**
 * Update agent information in existing conversation
 * Useful when reassigning cases to different agents
 */
export async function updateChatAgent(
  caseId: string,
  newAgentId: string,
  newAgentName: string
): Promise<void> {
  try {
    const participantsRef = ref(database, `chats/${caseId}/metadata/participants`);

    await update(participantsRef, {
      agentId: newAgentId,
      agentName: newAgentName,
    });

    logger.info('Chat agent updated', { caseId, newAgentId });
  } catch (error) {
    logger.error('Failed to update chat agent', error);
    throw error;
  }
}

/**
 * Delete a chat conversation
 * Should only be called when a case is permanently deleted
 */
export async function deleteFirebaseChat(caseId: string): Promise<void> {
  try {
    const chatRef = ref(database, `chats/${caseId}`);
    await set(chatRef, null);

    logger.info('Firebase chat deleted', { caseId });
  } catch (error) {
    logger.error('Failed to delete Firebase chat', error);
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
    // Determine chat room ID (use caseId if available, otherwise create from participant IDs)
    const chatRoomId = params.caseId || [params.senderId, params.recipientId].sort().join('-');

    logger.info('Chat room ID determined', { chatRoomId: chatRoomId.substring(0, 12) + '...' });

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
      caseId: params.caseId || chatRoomId, // REQUIRED by Firebase rules
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
      // Create full metadata structure that Firebase rules expect
      // Determine roles based on provided role information or fallback to alphabetical ordering
      let clientId: string;
      let clientName: string;
      let agentId: string;
      let agentName: string;

      if (params.senderRole && params.recipientRole) {
        // Use explicit roles if provided
        if (params.senderRole === 'CLIENT') {
          clientId = params.senderId;
          clientName = params.senderName;
          agentId = params.recipientId;
          agentName = params.recipientName;
        } else {
          clientId = params.recipientId;
          clientName = params.recipientName;
          agentId = params.senderId;
          agentName = params.senderName;
        }
      } else {
        // Fallback: Order alphabetically (original approach)
        const orderedIds = [params.senderId, params.recipientId].sort();
        clientId = orderedIds[0];
        clientName = orderedIds[0] === params.senderId ? params.senderName : params.recipientName;
        agentId = orderedIds[1];
        agentName = orderedIds[1] === params.senderId ? params.senderName : params.recipientName;
      }

      const metadataData = {
        participants: {
          clientId,
          clientName,
          agentId,
          agentName,
        },
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
      });

      try {
        await set(metadataRef, metadataData);
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
  attachments?: any[];
}
