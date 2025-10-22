// Mark all notifications as read API Route
// PUT /api/notifications/mark-all-read

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// PUT /api/notifications/mark-all-read - Mark all notifications as read for the authenticated user
const putHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // Update all unread notifications for this user
  const result = await prisma.notification.updateMany({
    where: {
      userId: req.user.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  logger.info('All notifications marked as read', {
    userId: req.user.userId,
    count: result.count,
  });

  return successResponse(
    {
      count: result.count,
      message: `${result.count} notification(s) marked as read`,
    },
    SUCCESS_MESSAGES.UPDATED
  );
});

// Apply middleware and authentication
export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);
