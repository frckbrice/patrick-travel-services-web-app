// POST /api/payments/intents/[id]/confirm - Confirm payment intent
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
import { confirmPaymentIntent, mapStripeStatusToPaymentStatus } from '@/lib/services/stripe';
import type { PaymentIntent } from '@/lib/types/payments';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/payments/intents/[id]/confirm - Confirm payment intent
const postHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Invalid payment intent ID', HttpStatus.BAD_REQUEST);
  }

  const body = await request.json();
  const { paymentMethodId } = body;

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

  // Check permissions - users can only confirm their own payments
  if (payment.userId !== req.user.userId && req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  // Check if payment is already completed or canceled
  if (payment.status === 'COMPLETED') {
    throw new ApiError('Payment intent is already completed', HttpStatus.BAD_REQUEST);
  }

  if (payment.status === 'CANCELED') {
    throw new ApiError(
      'Payment intent is canceled and cannot be confirmed',
      HttpStatus.BAD_REQUEST
    );
  }

  try {
    // Confirm payment intent with Stripe
    const stripeIntent = await confirmPaymentIntent(payment.stripeIntentId, paymentMethodId);

    // Update payment status in database
    const updatedStatus = mapStripeStatusToPaymentStatus(stripeIntent.status);

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: updatedStatus,
        clientSecret: stripeIntent.client_secret || payment.clientSecret,
      },
    });

    logger.info('Payment intent confirmed', {
      paymentId: payment.id,
      stripeIntentId: stripeIntent.id,
      status: updatedStatus,
      userId: req.user.userId,
    });

    // Map to client-expected format
    const paymentIntent: PaymentIntent = {
      id: updatedPayment.id,
      status: stripeIntent.status,
      amount: Number(updatedPayment.amount),
      currency: updatedPayment.currency,
      description: updatedPayment.description || undefined,
      createdAt: updatedPayment.createdAt.toISOString(),
      clientSecret: updatedPayment.clientSecret || undefined,
      metadata: (updatedPayment.metadata as Record<string, any>) || undefined,
    };

    return successResponse(paymentIntent, 'Payment intent confirmed successfully');
  } catch (error) {
    logger.error('Failed to confirm payment intent', error, {
      paymentId: id,
      userId: req.user.userId,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to confirm payment intent',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Apply middleware and authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
