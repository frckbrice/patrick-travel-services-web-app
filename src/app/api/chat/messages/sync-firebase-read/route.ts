// Firebase → PostgreSQL Read Status Sync API
// PUT /api/chat/messages/sync-firebase-read
// Syncs read status from Firebase to PostgreSQL (for mobile apps that update Firebase directly)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase/firebase-client';

interface SyncFirebaseReadRequest {
  caseId: string;
  messageIds?: string[]; // Optional: specific message IDs, otherwise syncs all unread messages
}

// Helper function to get PostgreSQL ID from Firebase UID
async function getPostgresIdFromFirebaseUid(firebaseUid: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid },
      select: { id: true },
    });
    return user?.id || null;
  } catch (error) {
    logger.error('Failed to get PostgreSQL ID from Firebase UID', error, { firebaseUid });
    return null;
  }
}

// PUT /api/chat/messages/sync-firebase-read - Sync Firebase read status to PostgreSQL
const putHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const body = (await request.json()) as SyncFirebaseReadRequest;

  if (!body.caseId) {
    throw new ApiError('caseId is required', HttpStatus.BAD_REQUEST);
  }

  try {
    // Get Firebase UID from the token (auth middleware provides it) or database
    const firebaseToken = (req as AuthenticatedRequest).firebaseToken;
    let firebaseUid = firebaseToken?.uid;

    if (!firebaseUid) {
      // Fallback: try to get from user's database record
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { firebaseId: true },
      });
      if (!user?.firebaseId) {
        throw new ApiError('User does not have Firebase UID', HttpStatus.BAD_REQUEST);
      }
      firebaseUid = user.firebaseId;
    }

    // Get messages from Firebase
    const messagesRef = ref(database, `chats/${body.caseId}/messages`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return successResponse({ count: 0, messageIds: [] }, 'No messages found in Firebase');
    }

    const updates: string[] = [];
    const messagesToCheck = body.messageIds || [];
    const syncPromises: Promise<void>[] = [];

    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      const firebaseMessageId = childSnapshot.key;

      // Only process messages marked as read in Firebase where user is recipient
      // Handle both Firebase UID and PostgreSQL ID formats
      const isRecipient =
        message.recipientId === firebaseUid || message.recipientId === req.user!.userId;

      if (message.isRead && isRecipient) {
        // If specific messageIds provided, only process those
        if (messagesToCheck.length > 0 && !messagesToCheck.includes(firebaseMessageId)) {
          return;
        }

        // Find PostgreSQL message by firebaseId and update
        const syncPromise = prisma.chatMessage
          .findFirst({
            where: {
              firebaseId: firebaseMessageId,
              recipientId: req.user!.userId,
              isRead: false, // Only update if not already read in PostgreSQL
            },
            select: { id: true },
          })
          .then((postgresMessage) => {
            if (postgresMessage) {
              return prisma.chatMessage.update({
                where: { id: postgresMessage.id },
                data: {
                  isRead: true,
                  readAt: message.readAt ? new Date(message.readAt) : new Date(),
                },
              });
            }
          })
          .then(() => {
            updates.push(firebaseMessageId);
          })
          .catch((error) => {
            logger.warn('Failed to sync individual message', {
              firebaseMessageId,
              error,
            });
          });

        syncPromises.push(syncPromise);
      }
    });

    await Promise.all(syncPromises);

    // Mark related notifications as read
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user.userId,
          caseId: body.caseId,
          type: 'NEW_MESSAGE',
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } catch (notifError) {
      logger.warn('Failed to mark related notifications as read', {
        error: notifError,
      });
    }

    logger.info('Firebase read status synced to PostgreSQL', {
      caseId: body.caseId,
      userId: req.user.userId,
      syncedCount: updates.length,
    });

    return successResponse(
      {
        count: updates.length,
        messageIds: updates,
      },
      `Synced ${updates.length} message(s) read status from Firebase to PostgreSQL`
    );
  } catch (error) {
    logger.error('Failed to sync Firebase read status', {
      caseId: body.caseId,
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
