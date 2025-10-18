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

  // Fetch emails (sent or received by user)
  const [emails, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [{ senderId: request.user.userId }, { recipientId: request.user.userId }],
      },
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
      orderBy: {
        sentAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.message.count({
      where: {
        OR: [{ senderId: request.user.userId }, { recipientId: request.user.userId }],
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      emails,
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

