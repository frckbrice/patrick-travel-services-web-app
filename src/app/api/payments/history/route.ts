// GET /api/payments/history - Get payment history
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import type { PaymentRecord } from '@/lib/types/payments';

// GET /api/payments/history - Get payment history
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');

  // Determine which user's payments to fetch
  let targetUserId: string;

  if (req.user.role === 'ADMIN') {
    // Admins can view any user's payments if userId is provided
    targetUserId = userIdParam || req.user.userId;
  } else {
    // Clients and agents can only view their own payments
    targetUserId = req.user.userId;
  }

  try {
    // Fetch payments from database
    const payments = await prisma.payment.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        description: true,
        caseNumber: true,
        status: true,
        createdAt: true,
      },
    });

    // Map to client-expected format
    const paymentRecords: PaymentRecord[] = payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description || '',
      caseNumber: payment.caseNumber || undefined,
      date: payment.createdAt.toISOString(),
      status:
        payment.status === 'COMPLETED'
          ? 'completed'
          : payment.status === 'PENDING' || payment.status === 'PROCESSING'
            ? 'pending'
            : payment.status === 'FAILED'
              ? 'failed'
              : payment.status === 'REFUNDED'
                ? 'refunded'
                : 'pending',
    }));

    logger.info('Payment history retrieved', {
      userId: targetUserId,
      count: paymentRecords.length,
      requesterId: req.user.userId,
      requesterRole: req.user.role,
    });

    return successResponse(paymentRecords, 'Payment history retrieved successfully');
  } catch (error) {
    logger.error('Failed to retrieve payment history', error, {
      userId: targetUserId,
      requesterId: req.user.userId,
    });

    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to retrieve payment history',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
