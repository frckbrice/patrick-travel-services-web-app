// Message Status Service - Handle read receipts and delivery status
// Real-time status updates for messages

import { ref, update, get } from 'firebase/database';
import { database } from './firebase-client';
import { logger } from '@/lib/utils/logger';

/**
 * Mark message as delivered (when recipient comes online)
 */
export async function markMessageAsDelivered(chatRoomId: string, messageId: string): Promise<void> {
  try {
    const messageRef = ref(database, `chats/${chatRoomId}/messages/${messageId}`);

    await update(messageRef, {
      deliveryStatus: 'delivered',
      deliveredAt: Date.now(),
    });

    logger.debug('Message marked as delivered', { chatRoomId, messageId });
  } catch (error) {
    logger.error('Failed to mark message as delivered', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Mark message as read (when recipient views it)
 */
export async function markMessageAsRead(
  chatRoomId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const messageRef = ref(database, `chats/${chatRoomId}/messages/${messageId}`);

    // Get message to verify recipient
    const snapshot = await get(messageRef);
    if (!snapshot.exists()) {
      return;
    }

    const message = snapshot.val();

    // Only recipient can mark as read
    if (message.recipientId !== userId) {
      return;
    }

    // Don't mark as read if already read
    if (message.isRead) {
      return;
    }

    await update(messageRef, {
      isRead: true,
      readAt: Date.now(),
      deliveryStatus: 'read',
    });

    logger.debug('Message marked as read', { chatRoomId, messageId });
  } catch (error) {
    logger.error('Failed to mark message as read', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Mark all messages in a chat room as read for a user
 */
export async function markAllMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
  try {
    const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return;
    }

    const updates: Record<string, any> = {};
    const timestamp = Date.now();

    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      const messageId = childSnapshot.key;

      // Only mark unread messages where user is recipient
      if (message.recipientId === userId && !message.isRead && messageId) {
        updates[`chats/${chatRoomId}/messages/${messageId}/isRead`] = true;
        updates[`chats/${chatRoomId}/messages/${messageId}/readAt`] = timestamp;
        updates[`chats/${chatRoomId}/messages/${messageId}/deliveryStatus`] = 'read';
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      logger.info('Marked all messages as read', {
        chatRoomId,
        userId,
        count: Object.keys(updates).length / 3, // Each message has 3 updates
      });
    }
  } catch (error) {
    logger.error('Failed to mark all messages as read', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get unread message count for a user in a chat room
 */
export async function getUnreadCount(chatRoomId: string, userId: string): Promise<number> {
  try {
    const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return 0;
    }

    let count = 0;
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (message.recipientId === userId && !message.isRead) {
        count++;
      }
    });

    return count;
  } catch (error) {
    logger.error('Failed to get unread count', error);
    return 0;
  }
}

/**
 * Batch mark messages as delivered when user comes online
 */
export async function markPendingMessagesAsDelivered(userId: string): Promise<void> {
  try {
    // This would require an index on recipient + deliveryStatus
    // For now, we'll handle this client-side when loading messages
    logger.debug('Marking pending messages as delivered', { userId });
  } catch (error) {
    logger.error('Failed to mark pending messages as delivered', error);
  }
}
