// DELETE /api/users/account - Delete user account (GDPR Right to Erasure)
// Implements soft delete with 30-day grace period before permanent deletion
// Immediately: Sets isActive=false, anonymizes email, schedules deletion
// After 30 days: Scheduled job permanently deletes all user data

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  reason: z.string().optional(), // Optional reason for deletion (for internal tracking)
});

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const userId = req.user.userId;

  // Parse optional deletion reason
  let reason: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    const validationResult = deleteAccountSchema.safeParse(body);
    if (validationResult.success) {
      reason = validationResult.data.reason;
    }
  } catch {
    // Ignore parsing errors for optional body
  }

  logger.info('Account deletion requested', { userId, reason });

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      deletionScheduledFor: true,
    },
  });

  if (!user) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Check if already scheduled for deletion
  if (user.deletionScheduledFor) {
    return successResponse(
      {
        message: `Account deletion already scheduled for ${user.deletionScheduledFor.toISOString()}. Your data will be permanently deleted within 30 days.`,
        scheduledFor: user.deletionScheduledFor.toISOString(),
      },
      'Account deletion already scheduled'
    );
  }

  // Calculate deletion date (30 days from now)
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);

  // Perform soft delete: Mark inactive, anonymize email, schedule deletion
  const anonymizedEmail = `deleted_${userId}@deleted.local`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false, // User cannot login anymore
      email: anonymizedEmail, // Anonymize email immediately
      deletionScheduledFor: deletionDate, // Schedule permanent deletion
      deletionReason: reason || null, // Store optional reason
    },
  });

  // Delete push notification tokens (cleanup)
  await prisma.systemSetting
    .deleteMany({
      where: {
        key: {
          startsWith: `user:${userId}:pushToken:`,
        },
      },
    })
    .catch((error) => {
      logger.error('Failed to delete push tokens during account deletion', { userId, error });
    });

  // Revoke Firebase authentication (prevent login)
  if (adminAuth) {
    try {
      await adminAuth.updateUser(userId, {
        disabled: true, // Disable Firebase account
      });
      logger.info('Firebase account disabled', { userId });
    } catch (error) {
      logger.error('Failed to disable Firebase account', { userId, error });
      // Continue even if Firebase fails - user is already marked inactive in DB
    }
  }

  logger.info('Account deletion scheduled', {
    userId,
    scheduledFor: deletionDate.toISOString(),
    reason,
  });

  return successResponse(
    {
      message:
        'Account deletion scheduled. Your data will be permanently deleted within 30 days. You have been logged out and cannot access your account.',
      scheduledFor: deletionDate.toISOString(),
    },
    'Account deletion scheduled successfully'
  );
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);

// Note: A scheduled job (cron) should run daily to permanently delete users where
// deletionScheduledFor <= NOW(). See docs/BACKEND_GDPR_REQUIREMENTS.md for implementation.
