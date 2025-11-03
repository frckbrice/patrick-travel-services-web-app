import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/utils/logger';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

const handler = asyncHandler(async (req: NextRequest) => {
  const request = req as AuthenticatedRequest;

  if (!request.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const skip = (page - 1) * limit;
  const isReadParam = searchParams.get('isRead'); // Support isRead filter
  const direction = searchParams.get('direction'); // 'incoming' or 'outgoing'
  const searchQuery = searchParams.get('search') || ''; // Search in subject/content
  const sortBy = searchParams.get('sortBy') || 'sentAt'; // Sort column: sentAt, subject, etc.
  const sortOrder = searchParams.get('sortOrder') || 'desc'; // Sort direction: asc or desc

  // Build where clause with proper AND/OR logic
  const where: any = {
    AND: [
      {
        messageType: 'EMAIL', // Only get EMAIL type messages
      },
    ],
  };

  // Filter by direction: incoming (recipient) or outgoing (sender)
  if (direction === 'incoming') {
    where.AND.push({ recipientId: request.user.userId });
  } else if (direction === 'outgoing') {
    where.AND.push({ senderId: request.user.userId });
  } else {
    // Default: show both sent and received
    where.AND.push({
      OR: [{ senderId: request.user.userId }, { recipientId: request.user.userId }],
    });
  }

  // isRead filter - only filter read status if parameter is provided
  if (isReadParam !== null && isReadParam !== undefined && isReadParam !== '') {
    const isReadValue = isReadParam === 'true';
    where.AND.push({ isRead: isReadValue });
  }

  // Search filter - search in subject and content
  if (searchQuery) {
    where.AND.push({
      OR: [
        { subject: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
      ],
    });
  }

  // Build orderBy clause
  const orderBy: any = {};
  if (sortBy === 'sentAt' || sortBy === 'subject' || sortBy === 'createdAt') {
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    // Default to sentAt desc
    orderBy.sentAt = 'desc';
  }

  // Fetch emails (sent or received by user) - only EMAIL type messages
  const [emails, total] = await Promise.all([
    prisma.message.findMany({
      where,
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
            referenceNumber: true,
            serviceType: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.message.count({
      where,
    }),
  ]);

  // Map emailThreadId to threadId for mobile app compatibility
  const emailsWithThreadId = emails.map((email) => ({
    ...email,
    threadId: email.emailThreadId || null,
  }));

  return NextResponse.json({
    success: true,
    data: {
      emails: emailsWithThreadId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    },
  });
});

export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
