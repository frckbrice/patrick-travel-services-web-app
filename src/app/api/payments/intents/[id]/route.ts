// GET /api/payments/intents/[id] - Verify payment status
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
import { getPaymentIntent } from '@/lib/services/stripe';
import type { PaymentIntent } from '@/lib/types/payments';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/payments/intents/[id] - Verify payment status
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Invalid payment intent ID', HttpStatus.BAD_REQUEST);
  }

  // Find payment in database - try both internal ID and Stripe intent ID
  let payment = await prisma.payment.findUnique({
    where: { id },
  });

  // If not found by internal ID, try Stripe intent ID
  if (!payment) {
    payment = await prisma.payment.findUnique({
      where: { stripeIntentId: id },
    });
  }

  if (!payment) {
    throw new ApiError('Payment intent not found', HttpStatus.NOT_FOUND);
  }

  // Check permissions - users can only view their own payments
  if (payment.userId !== req.user.userId && req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  try {
    // Sync with Stripe to get latest status
    const stripeIntent = await getPaymentIntent(payment.stripeIntentId);

    // Update payment status if it changed
    const newStatus = stripeIntent.status;
    const mappedStatus =
      stripeIntent.status === 'succeeded'
        ? 'COMPLETED'
        : stripeIntent.status === 'canceled'
          ? 'CANCELED'
          : stripeIntent.status === 'processing'
            ? 'PROCESSING'
            : stripeIntent.status === 'requires_payment_method' ||
                stripeIntent.status === 'requires_confirmation'
              ? 'PENDING'
              : 'FAILED';

    if (payment.status !== mappedStatus) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: mappedStatus },
      });
    }

    // Map to client-expected format
    const paymentIntent: PaymentIntent = {
      id: payment.id,
      status: newStatus,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description || undefined,
      createdAt: payment.createdAt.toISOString(),
      clientSecret: payment.clientSecret || undefined,
      metadata: (payment.metadata as Record<string, any>) || undefined,
    };

    logger.info('Payment intent retrieved', {
      paymentId: payment.id,
      status: newStatus,
      userId: req.user.userId,
    });

    return successResponse(paymentIntent, 'Payment intent retrieved successfully');
  } catch (error) {
    logger.error('Failed to retrieve payment intent', error, {
      paymentId: id,
      userId: req.user.userId,
    });

    // If Stripe fails, return database record
    const paymentIntent: PaymentIntent = {
      id: payment.id,
      status:
        payment.status === 'COMPLETED'
          ? 'succeeded'
          : payment.status === 'CANCELED'
            ? 'canceled'
            : payment.status === 'PROCESSING'
              ? 'processing'
              : payment.status === 'FAILED'
                ? 'failed'
                : 'requires_payment_method',
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description || undefined,
      createdAt: payment.createdAt.toISOString(),
      clientSecret: payment.clientSecret || undefined,
      metadata: (payment.metadata as Record<string, any>) || undefined,
    };

    return successResponse(paymentIntent, 'Payment intent retrieved successfully');
  }
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
