// Chat Search API - Advanced search in archived messages
// Only possible with SQL (not Firebase)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { PAGINATION } from '@/lib/constants';

// GET /api/chat/search?q=visa&caseId=xxx&startDate=xxx&endDate=xxx&limit=50
// Note: limit is clamped to MAX_LIMIT (100) to prevent excessive resource usage
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
  const limitParam = searchParams.get('limit');

  if (!query || query.length < 2) {
    throw new ApiError('Search query must be at least 2 characters', HttpStatus.BAD_REQUEST);
  }

  // Validate and clamp limit
  let limit = limitParam ? parseInt(limitParam, 10) : PAGINATION.DEFAULT_LIMIT;

  if (isNaN(limit) || limit <= 0) {
    throw new ApiError('Limit must be a positive integer', HttpStatus.BAD_REQUEST);
  }

  // Clamp limit to MAX_LIMIT to prevent excessive resource usage
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);

  try {
    // Build search query
    const where: any = {
      OR: [{ senderId: req.user.userId }, { recipientId: req.user.userId }],
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    // Filter by case
    if (caseId) {
      where.caseId = caseId;
    }

    // Filter by date range - validate dates first
    if (startDate || endDate) {
      where.sentAt = {};

      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          throw new ApiError(
            'Invalid startDate format. Please provide a valid date.',
            HttpStatus.BAD_REQUEST
          );
        }
        where.sentAt.gte = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw new ApiError(
            'Invalid endDate format. Please provide a valid date.',
            HttpStatus.BAD_REQUEST
          );
        }
        where.sentAt.lte = parsedEndDate;
      }
    }

    // Search messages
    // Note: ChatMessage stores sender/recipient/case info directly (denormalized)
    const results = await prisma.chatMessage.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
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
