// POST /api/payments/intents/[id]/cancel - Cancel payment intent
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
import { cancelPaymentIntent } from '@/lib/services/stripe';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/payments/intents/[id]/cancel - Cancel payment intent
const postHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
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

  // Check permissions - users can only cancel their own payments
  if (payment.userId !== req.user.userId && req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  // Check if payment is already completed or canceled
  if (payment.status === 'COMPLETED') {
    throw new ApiError('Cannot cancel a completed payment', HttpStatus.BAD_REQUEST);
  }

  if (payment.status === 'CANCELED') {
    // Already canceled, return success
    return successResponse(null, 'Payment intent is already canceled');
  }

  try {
    // Cancel payment intent with Stripe
    await cancelPaymentIntent(payment.stripeIntentId);

    // Update payment status in database
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELED',
      },
    });

    logger.info('Payment intent canceled', {
      paymentId: payment.id,
      stripeIntentId: payment.stripeIntentId,
      userId: req.user.userId,
    });

    return successResponse(null, 'Payment intent canceled successfully');
  } catch (error) {
    logger.error('Failed to cancel payment intent', error, {
      paymentId: id,
      userId: req.user.userId,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to cancel payment intent',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Apply middleware and authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
