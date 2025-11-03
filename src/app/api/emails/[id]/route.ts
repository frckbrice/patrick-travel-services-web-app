// Individual Email Message API - Get single email by ID
// GET /api/emails/[id]
// PUT /api/emails/[id]

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { NotificationType } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/emails/[id] - Get single email message
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid email ID', HttpStatus.BAD_REQUEST);
  }

  try {
    // Find the email message
    const email = await prisma.message.findUnique({
      where: {
        id,
        messageType: 'EMAIL', // Only get EMAIL type messages
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        case: {
          select: {
            id: true,
            referenceNumber: true,
            serviceType: true,
          },
        },
      },
    });

    if (!email) {
      throw new ApiError('Email not found', HttpStatus.NOT_FOUND);
    }

    // Only sender or recipient can view the email
    if (email.senderId !== req.user.userId && email.recipientId !== req.user.userId) {
      logger.warn('Unauthorized email access attempt', {
        emailId: id,
        userId: req.user.userId,
        senderId: email.senderId,
        recipientId: email.recipientId,
      });
      throw new ApiError('You can only view emails sent to or from you', HttpStatus.FORBIDDEN);
    }

    logger.info('Email retrieved', {
      emailId: id,
      userId: req.user.userId,
      senderId: email.senderId,
      recipientId: email.recipientId,
    });

    // Map emailThreadId to threadId for mobile app compatibility
    const emailWithThreadId = {
      ...email,
      threadId: email.emailThreadId || null,
    };

    return successResponse({ email: emailWithThreadId }, 'Email retrieved successfully');
  } catch (error) {
    logger.error('Failed to get email', {
      emailId: id,
      userId: req.user.userId,
      error: (error as Error)?.message,
    });
    throw error;
  }
});

// PUT /api/emails/[id] - Mark email as read
const putHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid email ID', HttpStatus.BAD_REQUEST);
  }

  try {
    // Find the email message
    const email = await prisma.message.findUnique({
      where: {
        id,
        messageType: 'EMAIL',
      },
      select: {
        id: true,
        recipientId: true,
        isRead: true,
        readAt: true,
        senderId: true,
        caseId: true,
      },
    });

    if (!email) {
      throw new ApiError('Email not found', HttpStatus.NOT_FOUND);
    }

    // Only recipient can mark as read
    if (email.recipientId !== req.user.userId) {
      logger.warn('Unauthorized read attempt', {
        emailId: id,
        userId: req.user.userId,
        recipientId: email.recipientId,
      });
      throw new ApiError('You can only mark emails sent to you as read', HttpStatus.FORBIDDEN);
    }

    // Skip if already read
    if (email.isRead) {
      logger.info('Email already marked as read', { emailId: id });
      return successResponse(
        {
          emailId: email.id,
          isRead: true,
          readAt: email.readAt,
        },
        'Email already marked as read'
      );
    }

    const readAt = new Date();

    // Update email as read
    const updatedEmail = await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt,
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
        recipientId: true,
        senderId: true,
        caseId: true,
      },
    });

    // Mark related NEW_EMAIL notification as read (fire-and-forget)
    if (email.caseId) {
      prisma.notification
        .updateMany({
          where: {
            userId: req.user.userId,
            type: NotificationType.NEW_EMAIL,
            caseId: email.caseId,
            isRead: false,
          },
          data: {
            isRead: true,
          },
        })
        .then((result) => {
          if (result.count > 0) {
            logger.info('Marked related email notifications as read', {
              emailId: id,
              caseId: email.caseId,
              notificationsMarked: result.count,
            });
          }
        })
        .catch((error) => {
          logger.warn('Failed to mark related notifications as read', {
            emailId: id,
            caseId: email.caseId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    logger.info('Email marked as read', {
      emailId: id,
      userId: req.user.userId,
      readAt: readAt.toISOString(),
    });

    return successResponse(
      {
        emailId: updatedEmail.id,
        isRead: updatedEmail.isRead,
        readAt: updatedEmail.readAt,
      },
      'Email marked as read successfully'
    );
  } catch (error) {
    logger.error('Failed to mark email as read', {
      emailId: id,
      userId: req.user.userId,
      error: (error as Error)?.message,
    });
    throw error;
  }
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);
