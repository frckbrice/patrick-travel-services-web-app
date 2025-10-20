// React Query - Mutations for Messages feature
// REFACTORED: Direct Firebase client-side (no API routes needed)
// Mobile app compatible - uses same Firebase SDK

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { sendMessage } from '@/lib/firebase/chat.service';
import { useAuthStore } from '@/features/auth/store';
import { apiClient } from '@/lib/utils/axios';
import type { SendMessageInput, SendEmailInput } from '../types';
import { MESSAGES_KEY } from './queries';

// Send message mutation - DIRECT FIREBASE (no API)
// Mobile apps use the same Firebase SDK and chat.service functions
export function useSendMessage() {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      try {
        // Validate user is authenticated
        if (!user?.id || !user?.email) {
          throw new Error('User must be authenticated to send messages');
        }

        // Auto-fill sender data from authenticated user
        const senderName =
          data.senderName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        const senderEmail = data.senderEmail || user.email;
        const senderId = data.senderId || user.id;

        logger.info('Sending message', { senderId, recipientId: data.recipientId });

        // Direct Firebase write - instant, no API overhead
        const messageId = await sendMessage({
          senderId,
          senderName,
          senderEmail,
          recipientId: data.recipientId,
          recipientName: data.recipientName || '',
          recipientEmail: data.recipientEmail || '',
          content: data.content,
          caseId: data.caseId, // Optional - will be filtered out if undefined
          subject: data.subject, // Optional - will be filtered out if undefined
          attachments: data.attachments || [],
        });

        logger.info('Message sent successfully', { messageId });
        return messageId;
      } catch (error) {
        logger.error('Error in mutation function', error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: (messageId) => {
      // No need to invalidate - real-time listener will update automatically
      toast.success('Message sent');
      logger.info('Message sent via Firebase', { messageId });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to send message';
      toast.error(errorMessage);
      logger.error('Failed to send message', error);
    },
    // Force mutation to complete even if there are errors
    retry: false, // Don't retry on failure
  });
}

// Send email mutation - Uses REST API (PostgreSQL tracked)
export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendEmailInput) => {
      logger.info('Sending email', {
        recipientId: data.recipientId,
        caseId: data.caseId,
        subject: data.subject,
      });

      const response = await apiClient.post('/api/emails/send', {
        recipientId: data.recipientId,
        caseId: data.caseId,
        subject: data.subject,
        content: data.content,
        attachments: data.attachments || [],
      });

      logger.info('Email sent successfully', { messageId: response.data.data.message.id });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email sent successfully');
      // Invalidate messages to refresh email history
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to send email';
      toast.error(errorMessage);
      logger.error('Failed to send email', error);
    },
    retry: false,
  });
}
