// Notifications API Routes - GET (list) and POST (create) and PUT (mark as read)
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

// GET /api/notifications - Get user notifications with server-side filtering, sorting, pagination
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(request.url);

  // Pagination params
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  let limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (isNaN(limit) || limit <= 0) {
    throw new ApiError('Limit must be a positive integer', HttpStatus.BAD_REQUEST);
  }
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  // Filter params
  const typeFilter = searchParams.get('type'); // NotificationType
  const statusFilter = searchParams.get('status'); // 'read' | 'unread'
  const searchQuery = searchParams.get('search'); // Search in title/message

  // Sort params
  const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt' | 'type' | 'readAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' | 'desc'

  // Build where clause
  const where: any = {
    userId: req.user.userId,
  };

  // Type filter
  if (typeFilter) {
    where.type = typeFilter;
  }

  // Status filter (read/unread)
  if (statusFilter === 'read') {
    where.isRead = true;
  } else if (statusFilter === 'unread') {
    where.isRead = false;
  }

  // Search filter (title or message)
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { message: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Build orderBy clause
  const orderBy: any = {};
  if (sortBy === 'createdAt' || sortBy === 'readAt' || sortBy === 'type') {
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.createdAt = 'desc'; // Default
  }

  // Execute queries in parallel
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        case: {
          select: {
            id: true,
            referenceNumber: true,
            serviceType: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
    }),
  ]);

  logger.info('Notifications retrieved', {
    userId: req.user.userId,
    count: notifications.length,
    filters: { type: typeFilter, status: statusFilter, search: searchQuery },
  });

  return successResponse(
    {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        type: typeFilter,
        status: statusFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
      },
    },
    'Notifications retrieved successfully'
  );
});

// POST /api/notifications - Create notification (ADMIN/AGENT only)
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // Only ADMIN/AGENT can create notifications
  if (!['ADMIN', 'AGENT'].includes(req.user.role)) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const body = await request.json();
  const { userId, title, message, type } = body;

  // Validation
  if (!userId || !title || !message) {
    throw new ApiError('userId, title, and message are required', HttpStatus.BAD_REQUEST);
  }

  // create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: type || 'INFO',
      isRead: false,
    },
  });

  // Also create in Firebase Realtime Database for instant notifications (fire-and-forget)
  createRealtimeNotification(userId, {
    type: notification.type,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl || undefined,
  }).catch((error) => {
    logger.warn('Failed to create Firebase notification, but PostgreSQL notification exists', {
      error,
    });
  });

  // TODO: Send push notification to mobile device
  // TODO: Send email notification if enabled

  logger.info('Notification created', {
    notificationId: notification.id,
    createdBy: req.user.userId,
  });

  return successResponse({ notification }, SUCCESS_MESSAGES.CREATED, HttpStatus.CREATED);
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.GENEROUS)
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
