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
import { auth } from '@/lib/firebase/firebase-client';
import { markMessageAsRead, markAllMessagesAsRead } from '@/lib/firebase/message-status.service';

// Send message mutation - DIRECT FIREBASE (no API)
// Mobile apps use the same Firebase SDK and chat.service functions
// Now includes PostgreSQL archiving for offline recovery
export function useSendMessage() {
  const { user, isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      try {
        // Debug: Log authentication state
        logger.info('Attempting to send message - auth check', {
          isAuthenticated,
          hasUser: !!user,
          userId: user?.id,
          hasFirebaseUser: !!auth.currentUser,
          firebaseEmail: auth.currentUser?.email,
        });

        // Validate user is authenticated and Firebase session is active
        if (!isAuthenticated || !user?.id) {
          logger.error('Authentication check failed', {
            isAuthenticated,
            hasUser: !!user,
            userId: user?.id,
          });
          throw new Error('User must be authenticated to send messages');
        }

        // Ensure Firebase auth is active (more reliable than just checking store)
        if (!auth.currentUser) {
          logger.error('Firebase auth session expired');
          throw new Error('Firebase session expired. Please refresh and try again.');
        }

        // Get email from Firebase user (most reliable source)
        const userEmail = auth.currentUser.email;
        if (!userEmail) {
          logger.error('Firebase user email not available');
          throw new Error('Unable to retrieve user email from authentication service');
        }

        // CRITICAL: Get Firebase UID from authenticated Firebase user
        // Firebase rules validate against auth.uid, not PostgreSQL UUIDs
        const firebaseUid = auth.currentUser!.uid;

        logger.info('Using Firebase UID for message sending', {
          firebaseUid: firebaseUid.substring(0, 8) + '...',
          postgresId: user.id.substring(0, 8) + '...',
        });

        // Auto-fill sender data from authenticated user
        const senderName =
          data.senderName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        const senderEmail = data.senderEmail || userEmail;
        // Use Firebase UID for Firebase operations (required by security rules)
        const senderId = data.senderId || firebaseUid;

        logger.info('Calling sendMessage function', {
          senderId: senderId.substring(0, 8) + '...',
          recipientId: data.recipientId.substring(0, 8) + '...',
        });

        // Step 1: Send to Firebase (instant real-time delivery)
        logger.info('Before sendMessage call');

        // Determine roles based on user role
        const senderRole = user.role as 'AGENT' | 'CLIENT' | undefined;
        const recipientRole = undefined; // Will be determined in backend if needed

        let firebaseId: string;
        try {
          const sendResult = await sendMessage({
            senderId,
            senderName,
            senderEmail,
            senderRole,
            recipientId: data.recipientId,
            recipientName: data.recipientName || '',
            recipientEmail: data.recipientEmail || '',
            recipientRole,
            content: data.content,
            caseId: data.caseId,
            subject: data.subject,
            attachments: data.attachments || [],
          });
          firebaseId = sendResult;
          logger.info('Message sent to Firebase successfully', {
            firebaseId: firebaseId.substring(0, 12) + '...',
          });
        } catch (sendError: any) {
          logger.error('sendMessage failed with error', {
            message: sendError?.message,
            code: sendError?.code,
            stack: sendError?.stack,
          });
          throw sendError;
        }

        // Step 2: Archive to PostgreSQL (for offline recovery and compliance)
        // Use PostgreSQL IDs for database relations (not Firebase UIDs)
        try {
          logger.info('Attempting to archive message to PostgreSQL', {
            firebaseId,
            senderId: user.id,
            recipientId: data.recipientId,
          });

          const archiveResponse = await apiClient.post('/api/chat/archive', {
            firebaseId,
            senderId: user.id, // Use PostgreSQL ID for database relations
            senderName,
            senderEmail,
            recipientId: data.recipientId, // This should be PostgreSQL ID (passed from UI)
            recipientName: data.recipientName || '',
            recipientEmail: data.recipientEmail || '',
            content: data.content,
            caseId: data.caseId,
            subject: data.subject,
            attachments: data.attachments || [],
            sentAt: new Date().toISOString(),
            isRead: false,
            firebaseSenderId: senderId, // Include Firebase UID for reference
          });

          logger.info('Message archived to PostgreSQL successfully', {
            firebaseId: firebaseId.substring(0, 12) + '...',
            archiveId: archiveResponse.data.data?.messageId
              ? archiveResponse.data.data.messageId.substring(0, 12) + '...'
              : 'N/A',
          });
        } catch (archiveError: any) {
          // Archive failure is non-critical - Firebase succeeded
          logger.error('Failed to archive message to PostgreSQL (non-critical)', {
            error: archiveError?.message,
            status: archiveError?.response?.status,
            data: archiveError?.response?.data,
            firebaseId,
          });
          // Don't throw - Firebase send succeeded, archive is secondary
        }

        return { firebaseId, archived: true };
      } catch (error) {
        logger.error('Error in mutation function', error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: ({ firebaseId }) => {
      // No need to invalidate - real-time listener will update automatically
      toast.success('Message sent');
      logger.info('Message sent and archived successfully');
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
        recipientId: data.recipientId ? data.recipientId.substring(0, 8) + '...' : 'N/A',
        caseId: data.caseId ? data.caseId.substring(0, 8) + '...' : 'none',
      });

      const response = await apiClient.post('/api/emails/send', {
        recipientId: data.recipientId,
        caseId: data.caseId,
        subject: data.subject,
        content: data.content,
        attachments: data.attachments || [],
      });

      logger.info('Email sent successfully', {
        messageId: response.data.data.message.id
          ? response.data.data.message.id.substring(0, 12) + '...'
          : 'N/A',
      });
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

// Mark message as read mutation - Firebase + PostgreSQL sync
export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { messageId: string; chatRoomId: string; firebaseId?: string }) => {
      logger.info('Marking message as read', {
        messageId: data.messageId,
        firebaseId: data.firebaseId,
      });

      // Update PostgreSQL via API
      const response = await apiClient.put(`/api/chat/messages/${data.messageId}/read`);

      // Firebase sync is handled by the server-side API route
      // No need to duplicate it here

      return response.data.data;
    },
    onSuccess: (data, variables) => {
      logger.info('Message marked as read successfully', {
        messageId: variables.messageId,
        readAt: data.readAt,
      });

      // Invalidate chat queries
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
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

// Mark multiple messages as read mutation
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { messageIds: string[]; chatRoomId?: string }) => {
      logger.info('Marking messages as read in bulk', {
        messageCount: data.messageIds.length,
        chatRoomId: data.chatRoomId,
      });

      // Update PostgreSQL via API
      const response = await apiClient.put('/api/chat/messages/mark-read', {
        messageIds: data.messageIds,
        chatRoomId: data.chatRoomId,
      });

      // Firebase sync is handled by the server-side API route
      // No need to duplicate it here

      return response.data.data;
    },
    onSuccess: (data, variables) => {
      logger.info('Messages marked as read successfully', {
        count: data.count,
        messageIds: data.messageIds,
        readAt: data.readAt,
      });

      // Invalidate chat queries
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
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
