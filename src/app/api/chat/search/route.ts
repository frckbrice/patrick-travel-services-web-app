// Chat Search API - Advanced search in archived messages
// Only possible with SQL (not Firebase)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// GET /api/chat/search?q=visa&caseId=xxx&startDate=xxx&endDate=xxx&limit=50
const getHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const caseId = searchParams.get('caseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query || query.length < 2) {
        throw new ApiError('Search query must be at least 2 characters', HttpStatus.BAD_REQUEST);
    }

    try {
        // Build search query
        const where: any = {
            OR: [
                { senderId: req.user.userId },
                { recipientId: req.user.userId },
            ],
            content: {
                contains: query,
                mode: 'insensitive',
            },
        };

        // Filter by case
        if (caseId) {
            where.caseId = caseId;
        }

        // Filter by date range
        if (startDate || endDate) {
            where.sentAt = {};
            if (startDate) where.sentAt.gte = new Date(startDate);
            if (endDate) where.sentAt.lte = new Date(endDate);
        }

        // Search messages
        const results = await prisma.chatMessage.findMany({
            where,
            orderBy: { sentAt: 'desc' },
            take: limit,
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
                    },
                },
            },
        });

        logger.info('Chat search completed', {
            userId: req.user.userId,
            query,
            resultsCount: results.length,
        });

        return successResponse(
            {
                results,
                query,
                count: results.length,
            },
            'Search completed successfully'
        );
    } catch (error) {
        logger.error('Chat search failed', { error, query });
        throw new ApiError('Search failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

export const GET = authenticateToken(getHandler);

