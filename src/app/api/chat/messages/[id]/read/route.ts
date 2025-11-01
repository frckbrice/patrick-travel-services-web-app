// Chat Message Read Status API - Mark individual message as read
// PUT /api/chat/messages/[id]/read
// Updates both Firebase (real-time) and PostgreSQL (persistent) for consistency

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { markMessageAsRead } from '@/lib/firebase/message-status.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Helper function to get Firebase UID from PostgreSQL ID
async function getFirebaseUidFromPostgresId(postgresId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: postgresId },
      select: { firebaseId: true },
    });
    return user?.firebaseId || null;
  } catch (error) {
    logger.error('Failed to get Firebase UID from PostgreSQL ID', error, { postgresId });
    return null;
  }
}

// PUT /api/chat/messages/[id]/read - Mark message as read
const putHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid message ID', HttpStatus.BAD_REQUEST);
  }

  try {
    // Find the message in PostgreSQL
    const message = await prisma.chatMessage.findUnique({
      where: { id },
      select: {
        id: true,
        firebaseId: true,
        recipientId: true,
        isRead: true,
        readAt: true,
        senderId: true,
        content: true,
        sentAt: true,
        caseId: true,
      },
    });

    if (!message) {
      throw new ApiError('Message not found', HttpStatus.NOT_FOUND);
    }

    // Only recipient can mark as read
    if (message.recipientId !== req.user.userId) {
      logger.warn('Unauthorized read attempt', {
        messageId: id,
        userId: req.user.userId,
        recipientId: message.recipientId,
      });
      throw new ApiError('You can only mark messages sent to you as read', HttpStatus.FORBIDDEN);
    }

    // Skip if already read
    if (message.isRead) {
      logger.info('Message already marked as read', { messageId: id });
      return successResponse(
        {
          messageId: message.id,
          isRead: true,
          readAt: message.readAt,
        },
        'Message already marked as read'
      );
    }

    const readAt = new Date();

    // Update PostgreSQL (persistent storage)
    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: {
        isRead: true,
        readAt,
      },
      select: {
        id: true,
        firebaseId: true,
        isRead: true,
        readAt: true,
        recipientId: true,
        senderId: true,
      },
    });

    // Update Firebase (real-time) - non-blocking
    if (message.firebaseId) {
      try {
        // Use caseId as chatRoomId (Firebase structure uses caseId for chat rooms)
        // If no caseId, skip Firebase sync as it's not a case-based conversation
        if (message.caseId) {
          // Convert PostgreSQL user ID to Firebase UID
          const firebaseUid = await getFirebaseUidFromPostgresId(req.user.userId);
          if (firebaseUid) {
            await markMessageAsRead(message.caseId, message.firebaseId, firebaseUid);
          } else {
            logger.warn('Could not convert PostgreSQL ID to Firebase UID', {
              postgresId: req.user.userId,
            });
          }
        } else {
          logger.info('Skipping Firebase sync - no caseId for message', {
            messageId: id,
            firebaseId: message.firebaseId,
          });
        }

        logger.info('Message read status synced to Firebase', {
          messageId: id,
          firebaseId: message.firebaseId,
        });
      } catch (firebaseError) {
        // Firebase update failure is non-critical - PostgreSQL succeeded
        logger.warn('Failed to sync read status to Firebase (non-critical)', {
          messageId: id,
          firebaseId: message.firebaseId,
          error: firebaseError,
        });
      }
    }

    logger.info('Message marked as read', {
      messageId: id,
      userId: req.user.userId,
      readAt: readAt.toISOString(),
    });

    return successResponse(
      {
        messageId: updatedMessage.id,
        isRead: updatedMessage.isRead,
        readAt: updatedMessage.readAt,
      },
      'Message marked as read successfully'
    );
  } catch (error) {
    logger.error('Failed to mark message as read', {
      messageId: id,
      userId: req.user.userId,
      error: (error as Error)?.message,
    });
    throw error;
  }
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);
