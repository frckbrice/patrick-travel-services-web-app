// GET /api/conversations/history - Get conversation history for agents/admins
// Shows both email and chat message history grouped by conversation

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { searchParams } = new URL(request.url);
  const messageType = searchParams.get('type') as 'EMAIL' | 'CHAT' | null;
  const searchQuery = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build where clause
  const where: any = {
    OR: [{ senderId: req.user.userId }, { recipientId: req.user.userId }],
  };

  if (messageType) {
    where.messageType = messageType;
  }

  if (searchQuery) {
    where.OR = [
      ...(where.OR || []),
      { content: { contains: searchQuery, mode: 'insensitive' } },
      { subject: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Fetch messages with related data
  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      recipient: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      case: {
        select: {
          id: true,
          referenceNumber: true,
          serviceType: true,
          status: true,
        },
      },
    },
    orderBy: {
      sentAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  // Get total count for pagination
  const totalCount = await prisma.message.count({ where });

  // Group messages into conversations
  const conversationsMap = new Map<string, any>();

  messages.forEach((message) => {
    // Create conversation key (sorted user IDs to ensure consistency)
    const participantIds = [message.senderId, message.recipientId].sort();
    const conversationKey = participantIds.join('-');

    if (!conversationsMap.has(conversationKey)) {
      // Determine the other participant
      const otherParticipant =
        message.senderId === req.user!.userId ? message.recipient : message.sender;

      conversationsMap.set(conversationKey, {
        id: conversationKey,
        participantId: otherParticipant.id,
        participantName: `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim(),
        participantEmail: otherParticipant.email,
        participantRole: otherParticipant.role,
        lastMessage: message.content.substring(0, 100),
        lastMessageTime: message.sentAt,
        lastMessageType: message.messageType,
        messageCount: 1,
        unreadCount: 0,
        hasEmail: message.messageType === 'EMAIL',
        hasChat: message.messageType === 'CHAT',
        caseReference: message.case?.referenceNumber,
        caseId: message.caseId,
        messages: [message],
      });
    } else {
      const conversation = conversationsMap.get(conversationKey);
      conversation.messageCount += 1;
      if (message.messageType === 'EMAIL') conversation.hasEmail = true;
      if (message.messageType === 'CHAT') conversation.hasChat = true;
      if (!message.isRead && message.recipientId === req.user!.userId) {
        conversation.unreadCount += 1;
      }
      conversation.messages.push(message);
    }
  });

  const conversations = Array.from(conversationsMap.values()).map((conv) => {
    // Calculate conversation type
    let conversationType: 'EMAIL' | 'CHAT' | 'MIXED' = 'CHAT';
    if (conv.hasEmail && conv.hasChat) {
      conversationType = 'MIXED';
    } else if (conv.hasEmail) {
      conversationType = 'EMAIL';
    }

    return {
      id: conv.id,
      participantId: conv.participantId,
      participantName: conv.participantName,
      participantEmail: conv.participantEmail,
      participantRole: conv.participantRole,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      lastMessageType: conv.lastMessageType,
      messageCount: conv.messageCount,
      unreadCount: conv.unreadCount,
      conversationType,
      caseReference: conv.caseReference,
      caseId: conv.caseId,
    };
  });

  logger.info('Conversation history retrieved', {
    userId: req.user.userId,
    conversationCount: conversations.length,
    totalMessages: totalCount,
  });

  return successResponse(
    {
      conversations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    },
    'Conversation history retrieved successfully'
  );
});

export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
