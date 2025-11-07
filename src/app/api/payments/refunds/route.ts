// POST /api/payments/refunds - Request refund
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
import { createRefund, mapStripeRefundStatusToRefundStatus } from '@/lib/services/stripe';
import type { RefundResponse } from '@/lib/types/payments';

// POST /api/payments/refunds - Request refund
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const { paymentIntentId, amount, reason } = body;

  // Validation
  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    throw new ApiError('paymentIntentId is required', HttpStatus.BAD_REQUEST);
  }

  // Find payment in database - try both internal ID and Stripe intent ID
  let payment = await prisma.payment.findUnique({
    where: { id: paymentIntentId },
    include: {
      refunds: true,
    },
  });

  // If not found by internal ID, try Stripe intent ID
  if (!payment) {
    payment = await prisma.payment.findUnique({
      where: { stripeIntentId: paymentIntentId },
      include: {
        refunds: true,
      },
    });
  }

  if (!payment) {
    throw new ApiError('Payment intent not found', HttpStatus.NOT_FOUND);
  }

  // Check permissions - users can only refund their own payments
  if (payment.userId !== req.user.userId && req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  // Check if payment is completed
  if (payment.status !== 'COMPLETED') {
    throw new ApiError('Only completed payments can be refunded', HttpStatus.BAD_REQUEST);
  }

  // Calculate total refunded amount
  const totalRefunded = payment.refunds
    .filter((r) => r.status === 'SUCCEEDED')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const remainingAmount = Number(payment.amount) - totalRefunded;

  // Validate refund amount
  if (amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ApiError('Refund amount must be a positive number', HttpStatus.BAD_REQUEST);
    }

    if (amount > remainingAmount) {
      throw new ApiError(
        `Refund amount cannot exceed remaining amount (${remainingAmount})`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  try {
    // Create refund with Stripe (use Stripe payment intent ID)
    const stripeRefund = await createRefund({
      paymentIntentId: payment.stripeIntentId, // Use Stripe's payment intent ID
      amount: amount || remainingAmount, // If no amount specified, refund full remaining amount
      reason: reason || undefined,
    });

    // Convert amount from Stripe (cents) to major units for storage
    const refundAmountInMajorUnits = stripeRefund.amount / 100;

    // Save refund to database
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        userId: payment.userId,
        stripeRefundId: stripeRefund.id,
        amount: refundAmountInMajorUnits,
        currency: stripeRefund.currency,
        reason: reason || null,
        status: mapStripeRefundStatusToRefundStatus(stripeRefund.status),
      },
    });

    // Update payment status if fully refunded
    const newTotalRefunded = totalRefunded + refundAmountInMajorUnits;
    if (newTotalRefunded >= Number(payment.amount)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    logger.info('Refund created', {
      refundId: refund.id,
      stripeRefundId: stripeRefund.id,
      paymentId: payment.id,
      amount: refundAmountInMajorUnits,
      userId: req.user.userId,
    });

    // Map to client-expected format
    const refundResponse: RefundResponse = {
      id: refund.id,
      status: refund.status.toLowerCase() as 'pending' | 'succeeded' | 'failed',
      amount: refundAmountInMajorUnits,
      currency: refund.currency,
      paymentIntentId: payment.id,
      createdAt: refund.createdAt.toISOString(),
    };

    return successResponse(refundResponse, 'Refund created successfully', HttpStatus.CREATED);
  } catch (error) {
    logger.error('Failed to create refund', error, {
      paymentIntentId,
      userId: req.user.userId,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to create refund',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Apply middleware and authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
