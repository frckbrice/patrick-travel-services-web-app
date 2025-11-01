// Firebase Realtime Database service for CLIENT-SIDE real-time notifications
// For server-side notification creation, use notifications.service.server.ts

import { ref, onValue, push, set, off, get } from 'firebase/database';
import { database } from './firebase-client';
import { logger } from '@/lib/utils/logger';

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  isRead: boolean;
}

// Listen to user notifications in real-time
export function subscribeToUserNotifications(
  userId: string,
  onNewNotification: (notification: RealtimeNotification) => void
): () => void {
  const notificationsRef = ref(database, `notifications/${userId}`);
  let lastNotificationTime = Date.now();

  const callback = (snapshot: any) => {
    if (!snapshot.exists()) return;

    const notifications = snapshot.val();
    let maxValidTimestamp = lastNotificationTime;

    // Find new notifications (created after subscription)
    Object.entries(notifications).forEach(([key, value]: [string, any]) => {
      // Validate and parse notification timestamp
      const notificationTime = new Date(value.createdAt).getTime();

      // Skip entries with invalid dates (NaN)
      if (!Number.isFinite(notificationTime)) {
        logger.warn('Invalid notification date encountered', {
          notificationId: key,
          createdAt: value.createdAt,
        });
        return;
      }

      // Track the maximum valid timestamp seen
      if (notificationTime > maxValidTimestamp) {
        maxValidTimestamp = notificationTime;
      }

      // Only emit notifications that are newer than last processed time
      if (notificationTime > lastNotificationTime) {
        onNewNotification({
          id: key,
          ...value,
        });
      }
    });

    // Update lastNotificationTime to the largest timestamp seen (or keep current if no valid timestamps)
    lastNotificationTime = maxValidTimestamp;
  };

  onValue(notificationsRef, callback);

  return () => off(notificationsRef, 'value', callback);
}

// Note: createRealtimeNotification has been moved to notifications.service.server.ts
// to avoid bundling Firebase Admin SDK in client-side code
// Import it from '@/lib/firebase/notifications.service.server' in API routes only

// Mark notification as read in Firebase
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}/isRead`);
    await set(notificationRef, true);
    logger.info('Notification marked as read', { userId, notificationId });
  } catch (error) {
    logger.error('Failed to mark notification as read', error);
    throw error;
  }
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);

    if (!snapshot.exists()) return 0;

    const notifications = snapshot.val();
    return Object.values(notifications).filter((n: any) => !n.isRead).length;
  } catch (error) {
    logger.error('Failed to get unread count', error);
    return 0;
  }
}
