// POST /api/payments/intents - Create payment intent
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
import { createPaymentIntent, mapStripeStatusToPaymentStatus } from '@/lib/services/stripe';
import type { PaymentIntent } from '@/lib/types/payments';

// POST /api/payments/intents - Create payment intent
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const { amount, currency, description, metadata } = body;

  // Validation
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new ApiError('Amount must be a positive number', HttpStatus.BAD_REQUEST);
  }

  if (!description || typeof description !== 'string') {
    throw new ApiError('Description is required', HttpStatus.BAD_REQUEST);
  }

  // Extract caseNumber from metadata if present
  const caseNumber = metadata?.caseNumber || null;

  try {
    // Create Stripe payment intent
    const stripeIntent = await createPaymentIntent({
      amount,
      currency: currency || 'usd',
      description,
      metadata: {
        userId: req.user.userId,
        ...(caseNumber && { caseNumber }),
        ...metadata,
      },
    });

    // Convert amount from Stripe (cents) to major units for storage
    const amountInMajorUnits = stripeIntent.amount / 100;

    // Save payment intent to database
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.userId,
        stripeIntentId: stripeIntent.id,
        amount: amountInMajorUnits,
        currency: stripeIntent.currency,
        description: stripeIntent.description || description,
        status: mapStripeStatusToPaymentStatus(stripeIntent.status),
        caseNumber: caseNumber || null,
        metadata: metadata || null,
        clientSecret: stripeIntent.client_secret || null,
      },
    });

    logger.info('Payment intent created', {
      paymentId: payment.id,
      stripeIntentId: stripeIntent.id,
      userId: req.user.userId,
      amount: amountInMajorUnits,
    });

    // Map to client-expected format
    const paymentIntent: PaymentIntent = {
      id: payment.id,
      status: stripeIntent.status,
      amount: amountInMajorUnits,
      currency: stripeIntent.currency,
      description: payment.description || undefined,
      createdAt: payment.createdAt.toISOString(),
      clientSecret: stripeIntent.client_secret || undefined,
      metadata: metadata || undefined,
    };

    return successResponse(
      paymentIntent,
      'Payment intent created successfully',
      HttpStatus.CREATED
    );
  } catch (error) {
    logger.error('Failed to create payment intent', error, {
      userId: req.user.userId,
      amount,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to create payment intent',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Apply middleware and authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
