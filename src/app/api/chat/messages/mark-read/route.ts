// Chat Messages Bulk Read Status API - Mark multiple messages as read
// PUT /api/chat/messages/mark-read
// Efficiently updates multiple messages in a single transaction

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { markAllMessagesAsRead } from '@/lib/firebase/message-status.service';

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

interface MarkMessagesReadRequest {
  messageIds: string[];
  chatRoomId?: string; // Optional: for Firebase sync
}

// PUT /api/chat/messages/mark-read - Mark multiple messages as read
const putHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const body = (await request.json()) as MarkMessagesReadRequest;

  if (!body.messageIds || !Array.isArray(body.messageIds) || body.messageIds.length === 0) {
    throw new ApiError('messageIds array is required and cannot be empty', HttpStatus.BAD_REQUEST);
  }

  // Limit batch size for performance
  if (body.messageIds.length > 100) {
    throw new ApiError('Cannot mark more than 100 messages at once', HttpStatus.BAD_REQUEST);
  }

  try {
    // First, verify all messages exist and user has permission to mark them as read
    const messages = await prisma.chatMessage.findMany({
      where: {
        id: { in: body.messageIds },
        recipientId: req.user.userId, // Only messages sent to this user
        isRead: false, // Only unread messages
      },
      select: {
        id: true,
        firebaseId: true,
        recipientId: true,
        senderId: true,
        caseId: true,
      },
    });

    if (messages.length === 0) {
      return successResponse(
        {
          count: 0,
          messageIds: [],
        },
        'No messages found to mark as read'
      );
    }

    const readAt = new Date();
    const messageIdsToUpdate = messages.map((m) => m.id);

    // Update all messages in a single transaction for performance
    const result = await prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIdsToUpdate },
      },
      data: {
        isRead: true,
        readAt,
      },
    });

    // Auto-mark related notifications as read
    try {
      const caseIds = [...new Set(messages.map((m) => m.caseId).filter(Boolean))] as string[];
      if (caseIds.length > 0) {
        await prisma.notification.updateMany({
          where: {
            userId: req.user.userId,
            caseId: { in: caseIds },
            type: 'NEW_MESSAGE',
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });
      }
    } catch (notifError) {
      logger.warn('Failed to mark related notifications as read', {
        error: notifError,
      });
    }

    // Sync to Firebase - auto-determine chatRoomId if not provided
    const chatRoomId = body.chatRoomId || messages.find((m) => m.caseId)?.caseId;
    if (chatRoomId && messages.some((m) => m.firebaseId)) {
      try {
        // Convert PostgreSQL user ID to Firebase UID
        const firebaseUid = await getFirebaseUidFromPostgresId(req.user.userId);
        if (firebaseUid) {
          // Pass both IDs to handle format mismatches
          await markAllMessagesAsRead(chatRoomId, firebaseUid, req.user.userId);
        } else {
          logger.warn('Could not convert PostgreSQL ID to Firebase UID for bulk update', {
            postgresId: req.user.userId,
          });
        }

        logger.info('Bulk read status synced to Firebase', {
          chatRoomId,
          userId: req.user.userId,
          messageCount: messages.length,
        });
      } catch (firebaseError) {
        // Firebase update failure is non-critical - PostgreSQL succeeded
        logger.warn('Failed to sync bulk read status to Firebase (non-critical)', {
          chatRoomId,
          userId: req.user.userId,
          error: firebaseError,
        });
      }
    }

    logger.info('Messages marked as read in bulk', {
      userId: req.user.userId,
      requestedCount: body.messageIds.length,
      updatedCount: result.count,
      messageIds: messageIdsToUpdate,
    });

    return successResponse(
      {
        count: result.count,
        messageIds: messageIdsToUpdate,
        readAt: readAt.toISOString(),
      },
      `${result.count} message(s) marked as read successfully`
    );
  } catch (error) {
    logger.error('Failed to mark messages as read in bulk', {
      userId: req.user.userId,
      messageIds: body.messageIds,
      error: (error as Error)?.message,
    });
    throw error;
  }
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);
