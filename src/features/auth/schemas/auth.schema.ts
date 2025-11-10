// Authentication validation schemas using Zod

import { z } from 'zod';
import { normalizeEmail } from '@/lib/utils/email';

// Coerce common truthy string values ("true", "on", "1") to boolean true
const truthyBoolean = z.preprocess((val) => {
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    if (v === 'true' || v === 'on' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === 'off' || v === '0' || v === 'no') return false;
  }
  return val;
}, z.boolean());

const normalizedEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .transform((email) => normalizeEmail(email));

export const registerSchema = z.object({
  email: normalizedEmailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .optional()
  ),
  street: z.string().max(255, 'Street must be 255 characters or less').optional(),
  city: z.string().max(255, 'City must be 255 characters or less').optional(),
  country: z.string().max(255, 'Country must be 255 characters or less').optional(),
  inviteCode: z.preprocess((val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return val;
  }, z.string().optional()), // Optional invite code for AGENT/ADMIN registration

  // GDPR Consent Fields (mobile and web compliance)
  consentedAt: z.string().datetime().optional(), // ISO timestamp when user consented
  acceptedTerms: truthyBoolean.refine((val) => val === true, {
    message: 'You must accept the Terms & Conditions to create an account',
  }),
  acceptedPrivacy: truthyBoolean.refine((val) => val === true, {
    message: 'You must accept the Privacy Policy to create an account',
  }),
});

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: normalizedEmailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
