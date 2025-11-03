// React Query - Queries for Messages feature
// DEPRECATED: These API-based queries are slow and redundant
// USE INSTEAD: Real-time hooks from ../hooks/useRealtimeChat.ts
// - useRealtimeChatRooms() - Instant WebSocket chat rooms
// - useRealtimeMessages() - Instant WebSocket messages

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { ChatRoom, Message } from '../types';

export const MESSAGES_KEY = 'messages';

// Get email messages (for tracking email replies)
export function useEmails(filters?: { isRead?: boolean; limit?: number }) {
  return useQuery({
    queryKey: [MESSAGES_KEY, 'emails', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isRead !== undefined) params.append('isRead', String(filters.isRead));
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/api/emails?${params}`);
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds cache for recent emails
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * @deprecated Use useRealtimeChatRooms() from ../hooks/useRealtimeChat.ts instead
 * This API call is slow (30s+ timeout) and redundant
 * Real-time hook provides instant WebSocket updates
 */
export function useConversations(
  options?: Omit<UseQueryOptions<ChatRoom[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [MESSAGES_KEY, 'conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/api/messages');
      return response.data.data.conversations as ChatRoom[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    ...options,
  });
}

/**
 * @deprecated Use useRealtimeMessages() from ../hooks/useRealtimeChat.ts instead
 * This API call is slow and redundant
 * Real-time hook provides instant WebSocket updates
 */
export function useChatRoomMessages(chatRoomId: string | null, enabled = true) {
  return useQuery({
    queryKey: [MESSAGES_KEY, 'room', chatRoomId],
    queryFn: async () => {
      if (!chatRoomId) return [];
      const response = await apiClient.get(`/api/messages/${chatRoomId}`);
      return response.data.data.messages as Message[];
    },
    enabled: !!chatRoomId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });
}
