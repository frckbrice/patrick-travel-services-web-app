// Messages API Routes - DEPRECATED
// ⚠️ This API layer is no longer needed - use direct Firebase client-side
// 
// MIGRATION: All messaging now uses Firebase Realtime Database directly from client
// - Web app: Uses hooks in src/features/messages/hooks/useRealtimeChat.ts
// - Mobile app: Uses same Firebase SDK with chat.service.ts functions
//
// Benefits:
// - Faster (no API overhead)
// - True real-time (WebSocket)
// - Better offline support
// - Lower server costs
//
// Security: Managed by Firebase Security Rules (see firebase-security-rules.json)

import { NextRequest } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
    sendMessage,
    getUserChatRooms,
} from '@/lib/firebase/chat.service';

// GET /api/messages - Get user's conversations
const getHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    try {
        const chatRooms = await getUserChatRooms(req.user.userId);

        logger.info('Chat rooms retrieved', {
            userId: req.user.userId,
            count: chatRooms.length
        });

        return successResponse(
            { conversations: chatRooms },
            'Conversations retrieved successfully'
        );
    } catch (error) {
        logger.error('Error retrieving chat rooms', error);
        throw new ApiError(
            'Failed to retrieve conversations',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
});

// POST /api/messages - Send a new message
const postHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const body = await request.json();
    const { recipientId, recipientName, recipientEmail, content, caseId, subject, attachments } = body;

    // Validation
    if (!recipientId || !content) {
        throw new ApiError(
            'recipientId and content are required',
            HttpStatus.BAD_REQUEST
        );
    }

    try {
        const messageId = await sendMessage({
            senderId: req.user.userId,
            senderName: `${req.user.email}`, // You may want to fetch from DB
            senderEmail: req.user.email || '',
            recipientId,
            recipientName: recipientName || '',
            recipientEmail: recipientEmail || '',
            content,
            caseId,
            subject,
            attachments: attachments || [],
        });

        logger.info('Message sent', {
            messageId,
            senderId: req.user.userId,
            recipientId
        });

        return successResponse(
            { messageId },
            SUCCESS_MESSAGES.MESSAGE_SENT,
            HttpStatus.CREATED
        );
    } catch (error) {
        logger.error('Error sending message', error);
        throw new ApiError(
            'Failed to send message',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
    withRateLimit(
        authenticateToken(getHandler),
        RateLimitPresets.STANDARD
    )
);

export const POST = withCorsMiddleware(
    withRateLimit(
        authenticateToken(postHandler),
        RateLimitPresets.STANDARD
    )
);

