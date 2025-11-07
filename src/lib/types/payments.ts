/**
 * Payment Types
 * Shared types for payment operations matching client expectations
 */

export interface PaymentIntent {
  id: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'processing'
    | 'succeeded'
    | 'canceled'
    | string;
  amount: number; // major units
  currency: string;
  description?: string;
  createdAt?: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency?: string;
  description: string;
  caseNumber?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | string;
}

export interface RefundResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'failed' | string;
  amount: number;
  currency?: string;
  paymentIntentId: string;
  createdAt?: string;
}
