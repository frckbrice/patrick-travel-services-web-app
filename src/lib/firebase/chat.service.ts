// Firebase Chat Service for Backend
// Initializes and manages Firebase Realtime Database chat conversations

import { ref, set, update, get } from 'firebase/database';
import { database } from './firebase-client';
import { logger } from '@/lib/utils/logger';

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
 */
export async function initializeFirebaseChat(
  caseId: string,
  caseReference: string,
  clientId: string,
  clientName: string,
  agentId: string,
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
  agentId: string,
  agentName: string,
  clientName: string,
  caseReference: string
): Promise<void> {
  try {
    const messagesRef = ref(database, `chats/${caseId}/messages`);
    const welcomeMessageRef = ref(database, `chats/${caseId}/messages/${Date.now()}`);

    const welcomeMessage = {
      caseId,
      senderId: agentId,
      senderName: agentName,
      senderRole: 'AGENT',
      message: `Hello ${clientName.split(' ')[0]}, I'm ${agentName}, your advisor for case ${caseReference}. I've reviewed your case and I'm here to help. Feel free to ask any questions!`,
      timestamp: Date.now(),
      isRead: false,
    };

    await set(welcomeMessageRef, welcomeMessage);

    // Update conversation metadata
    const metadataRef = ref(database, `chats/${caseId}/metadata`);
    await update(metadataRef, {
      lastMessage: welcomeMessage.message.substring(0, 100),
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
