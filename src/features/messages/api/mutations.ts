// React Query - Mutations for Messages feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { SendMessageInput } from '../types';
import { MESSAGES_KEY } from './queries';

// Send message mutation
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: SendMessageInput) => {
            const response = await apiClient.post('/api/messages', data);
            return response.data.data.messageId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
            toast.success('Message sent successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to send message');
        },
    });
}

