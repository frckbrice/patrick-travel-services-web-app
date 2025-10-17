// Chat History API - Query archived messages from Neon
// Supports advanced queries not possible with Firebase

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// GET /api/chat/history?userId=xxx&caseId=xxx&search=xxx&limit=50&offset=0
const getHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const caseId = searchParams.get('caseId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        // Build query
        const where: any = {
            OR: [
                { senderId: req.user.userId },
                { recipientId: req.user.userId },
            ],
        };

        // Filter by specific user conversation
        if (userId) {
            where.OR = [
                { senderId: req.user.userId, recipientId: userId },
                { senderId: userId, recipientId: req.user.userId },
            ];
        }

        // Filter by case
        if (caseId) {
            where.caseId = caseId;
        }

        // Search in message content
        if (search) {
            where.content = {
                contains: search,
                mode: 'insensitive',
            };
        }

        // Get messages with pagination
        const messages = await prisma.chatMessage.findMany({
            where,
            orderBy: { sentAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                case: {
                    select: {
                        id: true,
                        serviceType: true,
                        status: true,
                    },
                },
            },
        });

        // Get total count
        const total = await prisma.chatMessage.count({ where });

        logger.info('Chat history retrieved', {
            userId: req.user.userId,
            count: messages.length,
            total,
        });

        return successResponse(
            {
                messages,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + messages.length < total,
                },
            },
            'Chat history retrieved successfully'
        );
    } catch (error) {
        logger.error('Failed to retrieve chat history', { error });
        throw new ApiError(
            'Failed to retrieve chat history',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
});

export const GET = authenticateToken(getHandler);

