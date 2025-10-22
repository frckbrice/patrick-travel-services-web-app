// POST /api/users/push-token - Save user's push notification token
// DELETE /api/users/push-token - Remove user's push token (on logout)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const pushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  deviceId: z.string().optional(), // Unique device identifier
});

// POST - Save push notification token
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const validationResult = pushTokenSchema.safeParse(body);

  if (!validationResult.success) {
    throw new ApiError(
      'Invalid input: ' +
        validationResult.error.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      HttpStatus.BAD_REQUEST
    );
  }

  const { token, platform, deviceId } = validationResult.data;
  const userId = req.user.userId;

  // Store push token in SystemSetting table
  // Key format: user:{userId}:pushToken:{platform}:{deviceId}
  const key = deviceId
    ? `user:${userId}:pushToken:${platform || 'unknown'}:${deviceId}`
    : `user:${userId}:pushToken:${platform || 'unknown'}`;

  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value: token,
      updatedBy: userId,
    },
    create: {
      key,
      value: token,
      category: 'push_notifications',
      updatedBy: userId,
    },
  });

  logger.info('Push token saved', {
    userId,
    platform: platform || 'unknown',
    hasDeviceId: !!deviceId,
  });

  return successResponse({ message: 'Push token saved successfully' }, 'Push token registered');
});

// DELETE - Remove push token (on logout or token invalidation)
const deleteHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const platform = searchParams.get('platform');

  const userId = req.user.userId;

  if (deviceId && platform) {
    // Delete specific device token
    const key = `user:${userId}:pushToken:${platform}:${deviceId}`;
    await prisma.systemSetting.deleteMany({
      where: { key },
    });

    logger.info('Push token deleted for specific device', { userId, platform, deviceId });
  } else {
    // Delete all push tokens for user
    await prisma.systemSetting.deleteMany({
      where: {
        key: {
          startsWith: `user:${userId}:pushToken:`,
        },
      },
    });

    logger.info('All push tokens deleted', { userId });
  }

  return successResponse({ message: 'Push token removed successfully' }, 'Push token unregistered');
});

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);

export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(deleteHandler), RateLimitPresets.STANDARD)
);
