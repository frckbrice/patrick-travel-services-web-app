// Chat History API - Query archived messages from Neon
// Supports advanced queries not possible with Firebase

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { PAGINATION } from '@/lib/constants';

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
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  // Validate and clamp limit
  let limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (isNaN(limit) || limit <= 0) {
    throw new ApiError('Limit must be a positive integer', HttpStatus.BAD_REQUEST);
  }

  // Clamp limit to MAX_LIMIT to prevent excessive resource usage
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Validate offset
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10) || 0) : 0;

  try {
    // Build query
    const where: any = {
      OR: [{ senderId: req.user.userId }, { recipientId: req.user.userId }],
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
    // Note: ChatMessage stores sender/recipient/case info directly (denormalized)
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset,
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
    throw new ApiError('Failed to retrieve chat history', HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

export const GET = authenticateToken(getHandler);
