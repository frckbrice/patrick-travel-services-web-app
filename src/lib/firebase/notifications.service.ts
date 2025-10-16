// Firebase Realtime Database service for real-time notifications

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

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
        if (!snapshot.exists()) return;

        const notifications = snapshot.val();
        
        // Find new notifications (created after subscription)
        Object.entries(notifications).forEach(([key, value]: [string, any]) => {
            const notificationTime = new Date(value.createdAt).getTime();
            
            if (notificationTime > lastNotificationTime) {
                onNewNotification({
                    id: key,
                    ...value,
                });
            }
        });
    });

    return () => off(notificationsRef);
}

// Create notification in Firebase Realtime Database
export async function createRealtimeNotification(
    userId: string,
    notification: Omit<RealtimeNotification, 'id' | 'userId' | 'createdAt' | 'isRead'>
): Promise<string> {
    try {
        const notificationsRef = ref(database, `notifications/${userId}`);
        const newNotificationRef = push(notificationsRef);
        
        const notificationData: Omit<RealtimeNotification, 'id'> = {
            userId,
            ...notification,
            createdAt: new Date().toISOString(),
            isRead: false,
        };

        await set(newNotificationRef, notificationData);
        
        logger.info('Realtime notification created', { 
            userId, 
            type: notification.type,
            notificationId: newNotificationRef.key 
        });

        return newNotificationRef.key || '';
    } catch (error) {
        logger.error('Failed to create realtime notification', error);
        throw error;
    }
}

// Mark notification as read in Firebase
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
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
