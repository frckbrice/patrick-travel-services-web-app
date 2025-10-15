// React Query - Mutations for Notifications feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { Notification, CreateNotificationInput } from '../types';
import { NOTIFICATIONS_KEY } from './queries';

// Mark notification as read
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.put(`/api/notifications/${id}`);
            return response.data.data.notification as Notification;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to mark as read');
        },
    });
}

// Delete notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/notifications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
            toast.success('Notification deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete notification');
        },
    });
}

// Create notification (ADMIN/AGENT only)
export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateNotificationInput) => {
            const response = await apiClient.post('/api/notifications', data);
            return response.data.data.notification as Notification;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
            toast.success('Notification created');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create notification');
        },
    });
}
