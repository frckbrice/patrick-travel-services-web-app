// React hook for real-time notifications using Firebase

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import {
  subscribeToUserNotifications,
  RealtimeNotification,
} from '@/lib/firebase/notifications.service';
import { showNotification } from '@/lib/notifications/push-notifications';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { NOTIFICATIONS_KEY } from '../api/queries';

export function useRealtimeNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const unsubscribe = subscribeToUserNotifications(
      user.id,
      (notification: RealtimeNotification) => {
        // Show in-app toast
        toast(notification.title, {
          description: notification.message,
          action: notification.actionUrl
            ? {
                label: 'View',
                onClick: () => router.push(notification.actionUrl || '/'),
              }
            : undefined,
          duration: 5000,
        });

        // Show browser push notification with proper error handling
        if (typeof window !== 'undefined' && 'Notification' in window) {
          // Check if permission is already granted
          if (Notification.permission === 'granted') {
            try {
              showNotification(notification.title, {
                body: notification.message,
                tag: notification.id,
                data: { url: notification.actionUrl },
              });
            } catch (error) {
              // Silently handle notification errors - don't break the app
              console.warn('Failed to show browser notification:', error);
            }
          }
          // Optionally, you could request permission if it's 'default'
          else if (Notification.permission === 'default') {
            // Request permission for future notifications
            Notification.requestPermission().catch(() => {});
          }
        }

        // Refresh list
        queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, user?.id, queryClient, router]);
}
