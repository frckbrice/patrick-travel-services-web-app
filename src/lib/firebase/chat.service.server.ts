// Server-side Firebase Chat Service (Admin SDK)
// Use only in API routes or server code. Avoids firebase/auth client usage.

import { adminDatabase } from './firebase-admin';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/db/prisma';

function getChatRoomId(clientId: string, agentId: string): string {
  const sorted = [clientId, agentId].sort();
  return `${sorted[0]}-${sorted[1]}`;
}

/**
 * Convert caseId to chatRoomId by looking up the case and generating
 * the clientId-agentId based room ID. This is needed because:
 * - Old system used caseId directly as chat room ID
 * - New system uses clientId-agentId format
 *
 * @param caseId - PostgreSQL case ID
 * @returns The chat room ID in format "clientId-agentId" (Firebase UIDs), or null if case not found or not assigned
 */
export async function getChatRoomIdFromCaseId(caseId: string): Promise<string | null> {
  try {
    // Get case with client and agent info
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        clientId: true,
        assignedAgentId: true,
        client: {
          select: { firebaseId: true },
        },
        assignedAgent: {
          select: { firebaseId: true },
        },
      },
    });

    if (!caseData || !caseData.assignedAgentId) {
      logger.warn('Case not found or not assigned to agent', { caseId });
      return null;
    }

    const clientFirebaseId = caseData.client.firebaseId;
    const agentFirebaseId = caseData.assignedAgent?.firebaseId;

    if (!clientFirebaseId || !agentFirebaseId) {
      logger.warn('Missing Firebase UIDs for case participants', {
        caseId,
        hasClientFirebaseId: !!clientFirebaseId,
        hasAgentFirebaseId: !!agentFirebaseId,
      });
      return null;
    }

    const chatRoomId = getChatRoomId(clientFirebaseId, agentFirebaseId);
    return chatRoomId;
  } catch (error) {
    logger.error('Failed to get chat room ID from case ID', error, { caseId });
    return null;
  }
}

/**
 * Find chat room ID for a case, checking both new format (clientId-agentId) and old format (caseId)
 * This provides backward compatibility during migration period
 *
 * @param caseId - PostgreSQL case ID
 * @returns The chat room ID, or null if not found
 */
export async function findChatRoomIdForCase(caseId: string): Promise<string | null> {
  if (!adminDatabase) {
    logger.error('Firebase Admin not initialized');
    return null;
  }

  // First try: Use new format (clientId-agentId)
  const newFormatRoomId = await getChatRoomIdFromCaseId(caseId);
  if (newFormatRoomId) {
    const snapshot = await adminDatabase.ref(`chats/${newFormatRoomId}`).get();
    if (snapshot.exists()) {
      return newFormatRoomId;
    }
  }

  // Fallback: Check if old format (caseId) exists
  const oldFormatSnapshot = await adminDatabase.ref(`chats/${caseId}`).get();
  if (oldFormatSnapshot.exists()) {
    logger.info('Found old format chat room for case', { caseId });
    return caseId;
  }

  return null;
}

export async function initializeFirebaseChat(
  caseId: string,
  caseReference: string,
  clientId: string,
  clientName: string,
  agentId: string,
  agentName: string
): Promise<void> {
  try {
    if (!adminDatabase) return;
    const chatRoomId = getChatRoomId(clientId, agentId);
    const conversationRef = adminDatabase.ref(`chats/${chatRoomId}/metadata`);

    const snapshot = await conversationRef.get();

    if (snapshot.exists()) {
      const existingData = snapshot.val() || {};
      const caseRefs = existingData.caseReferences || [];
      const caseExists = caseRefs.some((ref: any) => ref.caseId === caseId);

      if (!caseExists) {
        const updatedCaseRefs = [...caseRefs, { caseId, caseReference, assignedAt: Date.now() }];
        await conversationRef.update({
          caseReferences: updatedCaseRefs,
          updatedAt: Date.now(),
        });
      }

      const needsParticipantUpdate =
        existingData.participants?.agentId !== agentId ||
        existingData.participants?.agentName !== agentName;
      if (needsParticipantUpdate) {
        await conversationRef.update({
          participants: { clientId, clientName, agentId, agentName },
          updatedAt: Date.now(),
        });
      }
    } else {
      const metadata = {
        participants: { clientId, clientName, agentId, agentName },
        caseReferences: [{ caseId, caseReference, assignedAt: Date.now() }],
        createdAt: Date.now(),
        lastMessage: null as string | null,
        lastMessageTime: null as number | null,
      };
      await conversationRef.set(metadata);

      // index in userChats
      await Promise.all([
        adminDatabase.ref(`userChats/${agentId}/${chatRoomId}`).set({
          chatId: chatRoomId,
          participantName: clientName,
          lastMessage: null,
          lastMessageTime: null,
        }),
        adminDatabase.ref(`userChats/${clientId}/${chatRoomId}`).set({
          chatId: chatRoomId,
          participantName: agentName,
          lastMessage: null,
          lastMessageTime: null,
        }),
      ]);
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase chat (Admin)', error, {
      caseId,
      clientId,
      agentId,
    });
  }
}

export async function sendWelcomeMessage(
  caseId: string,
  agentId: string,
  agentName: string,
  clientName: string,
  caseReference: string,
  clientId: string
): Promise<void> {
  try {
    if (!adminDatabase) return;
    const chatRoomId = getChatRoomId(clientId, agentId);
    const timestamp = Date.now();

    const message = {
      caseId,
      senderId: agentId,
      senderName: agentName,
      content: `Hello ${clientName.split(' ')[0]}, I'm ${agentName}, your advisor for case ${caseReference}. I've reviewed your case and I'm here to help. Feel free to ask any questions!`,
      sentAt: timestamp,
      isRead: false,
    };

    const welcomeRef = adminDatabase.ref(`chats/${chatRoomId}/messages/${timestamp}`);
    await welcomeRef.set(message);

    await adminDatabase.ref(`chats/${chatRoomId}/metadata`).update({
      lastMessage: message.content.substring(0, 100),
      lastMessageTime: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    logger.error('Failed to send welcome message (Admin)', error, { caseId });
  }
}
