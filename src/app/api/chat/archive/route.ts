// Chat Message Archive API - Saves Firebase messages to Neon
// Part of hybrid approach: Real-time in Firebase + History in Neon

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { MessageAttachment } from '@/lib/types';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

interface ArchiveMessageRequest {
  firebaseId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  content: string;
  caseId?: string;
  subject?: string;
  isRead?: boolean;
  sentAt: string;
  attachments?: MessageAttachment[];
}

// POST /api/chat/archive - Archive Firebase message to Neon
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  // Verify authentication
  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const body = (await request.json()) as ArchiveMessageRequest;

  if (
    !body.firebaseId?.trim() ||
    !body.senderId?.trim() ||
    !body.recipientId?.trim() ||
    !body.content?.trim()
  ) {
    throw new ApiError(
      'Missing required fields: firebaseId, senderId, recipientId, content',
      HttpStatus.BAD_REQUEST
    );
  }

  // Verify the authenticated user is either the sender or recipient
  const userId = req.user.userId;
  if (userId !== body.senderId && userId !== body.recipientId) {
    logger.warn('Unauthorized archive attempt', {
      userId,
      senderId: body.senderId,
      recipientId: body.recipientId,
    });
    throw new ApiError('You can only archive messages you are involved in', HttpStatus.FORBIDDEN);
  }

  // Validate sentAt date format
  const sentAtDate = new Date(body.sentAt);
  if (isNaN(sentAtDate.getTime())) {
    throw new ApiError('Invalid sentAt date format', HttpStatus.BAD_REQUEST);
  }

  try {
    // Check if already archived (prevent duplicates)
    const existing = await prisma.chatMessage.findUnique({
      where: { firebaseId: body.firebaseId },
    });

    if (existing) {
      logger.info('Message already archived', { firebaseId: body.firebaseId });
      return successResponse({ messageId: existing.id }, 'Message already archived');
    }

    // Archive message to Neon
    const archivedMessage = await prisma.chatMessage.create({
      data: {
        firebaseId: body.firebaseId,
        senderId: body.senderId,
        senderName: body.senderName,
        senderEmail: body.senderEmail,
        recipientId: body.recipientId,
        recipientName: body.recipientName,
        recipientEmail: body.recipientEmail,
        content: body.content,
        caseId: body.caseId || null,
        subject: body.subject || null,
        isRead: body.isRead || false,
        sentAt: sentAtDate,
        attachments: body.attachments ? JSON.parse(JSON.stringify(body.attachments)) : null,
      },
    });

    logger.info('Message archived to Neon', {
      firebaseId: body.firebaseId,
      neonId: archivedMessage.id,
    });

    return successResponse(
      { messageId: archivedMessage.id },
      'Message archived successfully',
      HttpStatus.CREATED
    );
  } catch (error) {
    logger.error('Failed to archive message', {
      message: (error as Error)?.message,
      firebaseId: body.firebaseId,
    });
    throw new ApiError('Failed to archive message to database', HttpStatus.INTERNAL_SERVER_ERROR, {
      cause: error,
    });
  }
});

// Wrap with authentication middleware
export const POST = authenticateToken(postHandler);
