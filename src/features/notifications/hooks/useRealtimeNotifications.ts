// React hook for real-time notifications using Firebase

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { subscribeToUserNotifications, RealtimeNotification } from '@/lib/firebase/notifications.service';
import { showNotification } from '@/lib/notifications/push-notifications';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { NOTIFICATIONS_KEY } from '../api/queries';

export function useRealtimeNotifications() {
    const { user, isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        const unsubscribe = subscribeToUserNotifications(
            user.id,
            (notification: RealtimeNotification) => {
                // Show in-app toast
                toast(notification.title, {
                    description: notification.message,
                    action: notification.actionUrl ? {
                        label: 'View',
                        onClick: () => window.location.href = notification.actionUrl!,
                    } : undefined,
                    duration: 5000,
                });

                // Show browser push
                showNotification(notification.title, {
                    body: notification.message,
                    tag: notification.id,
                    data: { url: notification.actionUrl },
                });

                // Refresh list
                queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
            }
        );

        return () => unsubscribe();
    }, [isAuthenticated, user?.id, queryClient]);
}

