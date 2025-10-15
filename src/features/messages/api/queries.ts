// React Query - Queries for Messages feature

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { ChatRoom } from '../types';

export const MESSAGES_KEY = 'messages';

// Get user conversations
export function useConversations() {
    return useQuery({
        queryKey: [MESSAGES_KEY, 'conversations'],
        queryFn: async () => {
            const response = await apiClient.get('/api/messages');
            return response.data.data.conversations as ChatRoom[];
        },
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });
}

