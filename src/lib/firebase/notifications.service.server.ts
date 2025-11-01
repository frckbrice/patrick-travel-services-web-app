// Firebase Realtime Database service for SERVER-SIDE notification creation only
// This file should only be imported in API routes (server-side)

import { adminDatabase } from './firebase-admin';
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

// Create notification in Firebase Realtime Database
// Uses Admin SDK for server-side writes (bypasses security rules)
// This function should ONLY be called from server-side API routes
export async function createRealtimeNotification(
  userId: string,
  notification: Omit<RealtimeNotification, 'id' | 'userId' | 'createdAt' | 'isRead'>
): Promise<string> {
  try {
    // Use Admin SDK for server-side writes (bypasses security rules)
    if (!adminDatabase) {
      throw new Error(
        'Admin database not available. This function must be called from server-side code only.'
      );
    }

    // Generate a unique key for the notification (using timestamp + random suffix)
    const notificationId = `-${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
    const notificationRef = adminDatabase.ref(`notifications/${userId}/${notificationId}`);

    const notificationData: Omit<RealtimeNotification, 'id'> = {
      userId,
      ...notification,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    await notificationRef.set(notificationData);

    logger.info('Realtime notification created (Admin SDK)', {
      userId,
      type: notification.type,
      notificationId,
    });

    return notificationId;
  } catch (error) {
    logger.error('Failed to create realtime notification', error);
    throw error;
  }
}
