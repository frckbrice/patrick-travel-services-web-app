// Server-side Firebase Chat Service (Admin SDK)
// Use only in API routes or server code. Avoids firebase/auth client usage.

import { adminDatabase } from './firebase-admin';
import { logger } from '@/lib/utils/logger';

function getChatRoomId(clientId: string, agentId: string): string {
  const sorted = [clientId, agentId].sort();
  return `${sorted[0]}-${sorted[1]}`;
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
