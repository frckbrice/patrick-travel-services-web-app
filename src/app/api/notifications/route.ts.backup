// Notifications API Routes - GET (list) and POST (create) and PUT (mark as read)
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

// GET /api/notifications - Get user notifications
const getHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
        userId: req.user.userId,
    };

    if (unreadOnly) {
        where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
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
        count: notifications.length
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
        throw new ApiError(
            'userId, title, and message are required',
            HttpStatus.BAD_REQUEST
        );
    }

    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type: type || 'INFO',
            isRead: false,
        },
    });

    // TODO: Send push notification to mobile device
    // TODO: Send email notification if enabled

    logger.info('Notification created', {
        notificationId: notification.id,
        createdBy: req.user.userId
    });

    return successResponse(
        { notification },
        SUCCESS_MESSAGES.CREATED,
        HttpStatus.CREATED
    );
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
    withRateLimit(
        authenticateToken(getHandler),
        RateLimitPresets.GENEROUS
    )
);

export const POST = withCorsMiddleware(
    withRateLimit(
        authenticateToken(postHandler),
        RateLimitPresets.STANDARD
    )
);

