// Notifications API Routes - PUT (mark as read) and DELETE
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT /api/notifications/[id] - Mark as read
const putHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid notification ID', HttpStatus.BAD_REQUEST);
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Only the notification owner can mark it as read
  if (notification.userId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  logger.info('Notification marked as read', {
    notificationId: id,
    userId: req.user.userId,
  });

  return successResponse({ notification: updatedNotification }, 'Notification marked as read');
});

// DELETE /api/notifications/[id] - Delete notification
const deleteHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid notification ID', HttpStatus.BAD_REQUEST);
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Only the notification owner can delete it
  if (notification.userId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  await prisma.notification.delete({
    where: { id },
  });

  logger.info('Notification deleted', {
    notificationId: id,
    userId: req.user.userId,
  });

  return successResponse(null, SUCCESS_MESSAGES.DELETED);
});

// Apply middleware and authentication
export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.GENEROUS)
);

export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(deleteHandler), RateLimitPresets.STANDARD)
);
