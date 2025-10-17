// React Query - Mutations for Messages feature
// REFACTORED: Direct Firebase client-side (no API routes needed)
// Mobile app compatible - uses same Firebase SDK

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { sendMessage } from '@/lib/firebase/chat.service';
import type { SendMessageInput } from '../types';
import { MESSAGES_KEY } from './queries';

// Send message mutation - DIRECT FIREBASE (no API)
// Mobile apps use the same Firebase SDK and chat.service functions
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: SendMessageInput) => {
            // Direct Firebase write - instant, no API overhead
            const messageId = await sendMessage({
                senderId: data.senderId || '',
                senderName: data.senderName || '',
                senderEmail: data.senderEmail || '',
                recipientId: data.recipientId,
                recipientName: data.recipientName || '',
                recipientEmail: data.recipientEmail || '',
                content: data.content,
                caseId: data.caseId,
                subject: data.subject,
                attachments: data.attachments || [],
            });
            return messageId;
        },
        onSuccess: (messageId) => {
            // No need to invalidate - real-time listener will update automatically
            toast.success('Message sent');
            logger.info('Message sent via Firebase', { messageId });
        },
        onError: (error: any) => {
            toast.error('Failed to send message');
            logger.error('Failed to send message', error);
        },
    });
}

