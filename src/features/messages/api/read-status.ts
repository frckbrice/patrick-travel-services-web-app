// Chat Message Read Status Hooks
// React hooks for marking chat messages as read

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

interface MarkMessageReadResponse {
  messageId: string;
  isRead: boolean;
  readAt: string;
}

interface MarkMessagesReadResponse {
  count: number;
  messageIds: string[];
  readAt: string;
}

interface MarkMessageReadInput {
  messageId: string;
}

interface MarkMessagesReadInput {
  messageIds: string[];
  chatRoomId?: string;
}

// Hook for marking a single message as read
export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkMessageReadInput): Promise<MarkMessageReadResponse> => {
      logger.info('Marking message as read', { messageId: data.messageId });

      const response = await apiClient.put(`/api/chat/messages/${data.messageId}/read`);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      logger.info('Message marked as read successfully', {
        messageId: variables.messageId,
        readAt: data.readAt,
      });

      // Invalidate and refetch chat-related queries
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      toast.success('Message marked as read');
    },
    onError: (error: any, variables) => {
      logger.error('Failed to mark message as read', {
        messageId: variables.messageId,
        error: error?.response?.data?.message || error?.message,
      });

      const errorMessage = error?.response?.data?.message || 'Failed to mark message as read';
      toast.error(errorMessage);
    },
  });
}

// Hook for marking multiple messages as read
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkMessagesReadInput): Promise<MarkMessagesReadResponse> => {
      logger.info('Marking messages as read in bulk', {
        messageCount: data.messageIds.length,
        chatRoomId: data.chatRoomId,
      });

      const response = await apiClient.put('/api/chat/messages/mark-read', data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      logger.info('Messages marked as read successfully', {
        count: data.count,
        messageIds: data.messageIds,
        readAt: data.readAt,
      });

      // Invalidate and refetch chat-related queries
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      toast.success(`${data.count} message(s) marked as read`);
    },
    onError: (error: any, variables) => {
      logger.error('Failed to mark messages as read', {
        messageCount: variables.messageIds.length,
        error: error?.response?.data?.message || error?.message,
      });

      const errorMessage = error?.response?.data?.message || 'Failed to mark messages as read';
      toast.error(errorMessage);
    },
  });
}

// Hook for marking all messages in a conversation as read
export function useMarkAllMessagesRead() {
  const markMessagesRead = useMarkMessagesRead();

  return {
    ...markMessagesRead,
    markAllAsRead: (messageIds: string[], chatRoomId?: string) => {
      return markMessagesRead.mutate({
        messageIds,
        chatRoomId,
      });
    },
  };
}
