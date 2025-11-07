/**
 * Stripe Service
 * Handles all Stripe payment operations
 */

import Stripe from 'stripe';
import { logger } from '@/lib/utils/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY is not set. Payment functionality will be disabled.');
}

// Initialize Stripe client
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null;

/**
 * Create a Payment Intent
 */
export async function createPaymentIntent(params: {
  amount: number; // in major units (e.g., 150.00)
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    // Convert amount to minor units (cents)
    const amountInCents = Math.round(params.amount * 100);

    if (amountInCents < 50) {
      throw new Error('Amount must be at least $0.50');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: params.currency || 'usd',
      description: params.description,
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount: params.amount,
      currency: params.currency || 'usd',
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', error);
    throw error;
  }
}

/**
 * Retrieve a Payment Intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error('Failed to retrieve payment intent', error, { paymentIntentId });
    throw error;
  }
}

/**
 * Confirm a Payment Intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const confirmParams: Stripe.PaymentIntentConfirmParams = {};

    if (paymentMethodId) {
      confirmParams.payment_method = paymentMethodId;
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, confirmParams);

    logger.info('Payment intent confirmed', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to confirm payment intent', error, { paymentIntentId });
    throw error;
  }
}

/**
 * Cancel a Payment Intent
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    logger.info('Payment intent canceled', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to cancel payment intent', error, { paymentIntentId });
    throw error;
  }
}

/**
 * Create a Refund
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // in major units (e.g., 150.00) - optional for partial refund
  reason?: string;
}): Promise<Stripe.Refund> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    // Verify payment intent exists and is succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment intent must be succeeded before refunding');
    }

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: params.paymentIntentId, // Use payment intent ID directly (recommended)
      reason: params.reason ? (params.reason as Stripe.RefundCreateParams.Reason) : undefined,
    };

    // If amount is provided, convert to cents for partial refund
    if (params.amount) {
      refundParams.amount = Math.round(params.amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    logger.info('Refund created', {
      refundId: refund.id,
      paymentIntentId: params.paymentIntentId,
      amount: params.amount,
    });

    return refund;
  } catch (error) {
    logger.error('Failed to create refund', error, { paymentIntentId: params.paymentIntentId });
    throw error;
  }
}

/**
 * Map Stripe PaymentIntent status to our PaymentStatus enum
 */
export function mapStripeStatusToPaymentStatus(
  stripeStatus: Stripe.PaymentIntent.Status
): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'REFUNDED' {
  switch (stripeStatus) {
    case 'requires_payment_method':
    case 'requires_confirmation':
      return 'PENDING';
    case 'processing':
      return 'PROCESSING';
    case 'succeeded':
      return 'COMPLETED';
    case 'canceled':
      return 'CANCELED';
    case 'requires_action':
    case 'requires_capture':
      return 'PROCESSING';
    default:
      return 'FAILED';
  }
}

/**
 * Map Stripe Refund status to our RefundStatus enum
 */
export function mapStripeRefundStatusToRefundStatus(
  stripeStatus: Stripe.Refund['status'] | null | undefined
): 'PENDING' | 'SUCCEEDED' | 'FAILED' {
  switch (stripeStatus) {
    case 'pending':
      return 'PENDING';
    case 'succeeded':
      return 'SUCCEEDED';
    case 'failed':
    case 'canceled':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}
