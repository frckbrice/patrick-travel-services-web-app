// Incoming Email Webhook Handler
// Receives email replies from:
// 1. Mobile app (JSON payload) - when client replies via email from mobile app
// 2. Email forwarding services (form-data) - SendGrid, Mailgun, etc. (optional)
//
// POST /api/emails/incoming
//
// Mobile App Request Format (JSON):
// {
//   "threadId": "1234567890-userId-abc123",  // Required: email thread ID
//   "senderId": "user-uuid",                  // Required: client user ID who is replying
//   "content": "Reply message text",          // Required: email reply content
//   "subject": "Re: Original Subject"         // Optional: reply subject
// }
//
// Example Mobile App Request:
// POST /api/emails/incoming
// Content-Type: application/json
// Authorization: Bearer <jwt-token>
// {
//   "threadId": "1704067200000-abc123-def456",
//   "senderId": "550e8400-e29b-41d4-a716-446655440000",
//   "content": "Thank you for the update. I have a question about...",
//   "subject": "Re: Case Status Update"
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { MessageType, NotificationType } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { sendPushNotificationToUser } from '@/lib/notifications/expo-push.service';
import { extractThreadIdFromHeaders, parseEmailContent } from '@/lib/services/email-parser.service';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

// Verify webhook authentication for email forwarding services (optional)
// function verifyWebhookAuth(request: NextRequest): boolean {
//     const authHeader = request.headers.get('authorization');
//     const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;

//     // If webhook secret is configured, verify it
//     if (webhookSecret) {
//         if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
//             return false;
//         }
//     }

//     return true;
// }

// Handle incoming email POST requests
const postHandler = async (request: NextRequest) => {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Check authentication: mobile app uses JWT token, email forwarding uses webhook secret
    const authHeader = request.headers.get('authorization');
    const isMobileApp =
      contentType.includes('application/json') && authHeader?.startsWith('Bearer ');
    const isWebhookService = !isMobileApp;

    // // For email forwarding services, verify webhook secret if configured
    // if (isWebhookService && !verifyWebhookAuth(request)) {
    //     logger.warn('Unauthorized incoming email webhook attempt');
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Note: Mobile app authentication should be handled by middleware if needed
    logger.info('Incoming email', {
      isMobileApp,
      isWebhookService,
      authHeader,
    });

    // Check if request is JSON (from mobile app) or form-data (from email forwarding service)
    let emailData: {
      fromEmail?: string;
      toEmail?: string;
      subject?: string;
      text?: string;
      html?: string;
      headers?: Record<string, string> | string;
      threadId?: string; // Direct thread ID from mobile app
      senderId?: string; // User ID from mobile app
      content?: string; // Direct content from mobile app
    } = {};

    let fromEmail = '';
    let toEmail = '';
    let subject = '';
    let text = '';
    let html = '';
    let headersRaw: string | Record<string, string> = '';
    let directThreadId: string | undefined;
    let directSenderId: string | undefined;
    let directContent: string | undefined;

    if (contentType.includes('application/json')) {
      // JSON payload from mobile app
      const body = await request.json();
      emailData = body;

      // Note: Mobile app authentication should be handled by middleware if needed
      logger.info('\n\n\n Incoming email', {
        emailData,
      });

      // Mobile app can send data in two formats:
      // 1. Direct format: { threadId, senderId, content, subject }
      // 2. Email format: { fromEmail, subject, text, html, headers }

      directThreadId = emailData.threadId;
      directSenderId = emailData.senderId;
      directContent = emailData.content;

      fromEmail = emailData.fromEmail || '';
      subject = emailData.subject || '';
      text = emailData.text || '';
      html = emailData.html || '';
      headersRaw = emailData.headers || {};

      logger.info('Incoming email from mobile app', {
        hasDirectData: !!(directThreadId && directSenderId && directContent),
        hasEmailFormat: !!fromEmail,
      });
    } else {
      // Form-data from email forwarding service (SendGrid, Mailgun, etc.)
      const formData = await request.formData();

      fromEmail = (formData.get('from') || formData.get('sender') || '') as string;
      toEmail = (formData.get('to') || formData.get('recipient') || '') as string;
      subject = (formData.get('subject') || '') as string;
      text = (formData.get('text') || formData.get('text-plain') || '') as string;
      html = (formData.get('html') || formData.get('text-html') || '') as string;
      headersRaw = (formData.get('headers') || formData.get('Headers') || '') as string;

      logger.info('Incoming email from forwarding service', {
        fromEmail,
        subject: subject.substring(0, 100),
      });
    }

    // Parse headers if provided
    let headers: Record<string, string> = {};
    if (headersRaw) {
      if (typeof headersRaw === 'object') {
        headers = headersRaw;
      } else if (typeof headersRaw === 'string') {
        try {
          // Headers might be a JSON string or newline-separated
          if (headersRaw.startsWith('{')) {
            headers = JSON.parse(headersRaw);
          } else {
            // Parse newline-separated headers
            headersRaw.split('\n').forEach((line) => {
              const colonIndex = line.indexOf(':');
              if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim().toLowerCase();
                const value = line.substring(colonIndex + 1).trim();
                headers[key] = value;
              }
            });
          }
        } catch (e) {
          logger.warn('Failed to parse email headers', { error: e });
        }
      }
    }

    // Also check individual header fields (for form-data requests)
    const inReplyTo = headers['in-reply-to'] || '';
    const references = headers['references'] || '';
    const xThreadId = headers['x-thread-id'] || '';

    // Extract thread ID - prioritize direct threadId from mobile app, then try headers
    let threadId: string | null = null;

    if (directThreadId) {
      // Mobile app provided threadId directly
      threadId = directThreadId;
      logger.info('Using direct threadId from mobile app', { threadId });
    } else {
      // Extract from headers/subject (for email forwarding services)
      threadId = extractThreadIdFromHeaders({
        'X-Thread-ID': xThreadId,
        'In-Reply-To': inReplyTo,
        References: references,
        subject: subject,
      });
    }

    if (!threadId) {
      logger.warn('Could not extract thread ID from incoming email', {
        fromEmail,
        subject,
        headers: { 'X-Thread-ID': xThreadId, 'In-Reply-To': inReplyTo, References: references },
      });
      return NextResponse.json(
        { error: 'Thread ID not found in email headers', processed: false },
        { status: 400 }
      );
    }

    // Find original message by thread ID
    const originalMessage = await prisma.message.findFirst({
      where: {
        emailThreadId: threadId,
        messageType: MessageType.EMAIL,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        case: {
          select: {
            id: true,
            referenceNumber: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc', // Get most recent message in thread
      },
    });

    if (!originalMessage) {
      logger.warn('Original message not found for incoming email', {
        threadId,
        fromEmail,
        subject,
      });
      return NextResponse.json(
        { error: 'Original message not found', processed: false },
        { status: 404 }
      );
    }

    // Identify the reply sender
    let replyFromUser;

    if (directSenderId) {
      // Mobile app provided senderId directly - use it
      replyFromUser = await prisma.user.findUnique({
        where: { id: directSenderId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!replyFromUser) {
        logger.warn('Reply from unknown user ID (mobile app)', {
          senderId: directSenderId,
          threadId,
        });
        return NextResponse.json(
          { error: 'Reply from unknown user', processed: false },
          { status: 400 }
        );
      }
    } else {
      // Email forwarding service - identify by email address
      replyFromUser = await prisma.user.findFirst({
        where: {
          email: fromEmail,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!replyFromUser) {
        logger.warn('Reply from unknown user email', {
          fromEmail,
          threadId,
        });
        return NextResponse.json(
          { error: 'Reply from unregistered email address', processed: false },
          { status: 400 }
        );
      }
    }

    // Verify the reply is from the original recipient
    if (replyFromUser.id !== originalMessage.recipientId) {
      logger.warn('Reply from wrong user - not the original recipient', {
        replyUserId: replyFromUser.id,
        originalRecipientId: originalMessage.recipientId,
        threadId,
      });
      return NextResponse.json(
        { error: 'Reply not from original recipient', processed: false },
        { status: 403 }
      );
    }

    // Parse email content - use direct content from mobile app or parse from text/html
    let emailContent: string;

    if (directContent) {
      // Mobile app provided content directly
      emailContent = directContent.trim();
    } else {
      // Parse from email format (text/html)
      const parsed = parseEmailContent({
        text: text,
        html: html,
      });
      emailContent = parsed;
    }

    if (!emailContent || !emailContent.trim()) {
      logger.warn('Incoming email has no content', {
        fromEmail,
        threadId,
      });
      return NextResponse.json(
        { error: 'Email has no content', processed: false },
        { status: 400 }
      );
    }

    // Extract reply subject (remove "Re:", "Fwd:", etc.)
    const replySubject = (subject as string).replace(/^(Re:|Fwd?:|RE:|FW:)\s*/i, '').trim();
    const finalSubject = replySubject || originalMessage.subject || 'Re: Email';

    // Create reply message in database
    const replyMessage = await prisma.message.create({
      data: {
        senderId: replyFromUser.id, // Client who replied
        recipientId: originalMessage.senderId, // Original sender (agent/admin)
        caseId: originalMessage.caseId,
        subject: finalSubject,
        content: emailContent,
        messageType: MessageType.EMAIL,
        emailThreadId: threadId, // Same thread ID
        replyToId: originalMessage.id, // Link to original message
        isRead: false,
        sentAt: new Date(),
      },
    });

    logger.info('Email reply processed successfully', {
      replyMessageId: replyMessage.id,
      originalMessageId: originalMessage.id,
      threadId,
      fromUserId: replyFromUser.id,
      toUserId: originalMessage.senderId,
    });

    // Create notification for original sender (agent/admin)
    const originalSenderName = `${originalMessage.sender.firstName} ${originalMessage.sender.lastName}`;
    const replySenderName = `${replyFromUser.firstName} ${replyFromUser.lastName}`;

    const notification = await prisma.notification.create({
      data: {
        userId: originalMessage.senderId,
        caseId: originalMessage.caseId,
        type: NotificationType.NEW_EMAIL,
        title: `Email reply from ${replySenderName}`,
        message: `Subject: ${finalSubject.substring(0, 100)}${finalSubject.length > 100 ? '...' : ''}`,
        isRead: false,
        actionUrl: '/dashboard/messages',
      },
    });

    // Send Firebase realtime notification (fire-and-forget)
    createRealtimeNotification(originalMessage.senderId, {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl || undefined,
    }).catch((error) => {
      logger.warn('Failed to create Firebase notification for email reply', {
        error,
        notificationId: notification.id,
        userId: originalMessage.senderId,
      });
    });

    // Send push notification to original sender (fire-and-forget)
    sendPushNotificationToUser(originalMessage.senderId, {
      title: notification.title,
      body: notification.message,
      data: {
        type: notification.type,
        notificationId: notification.id,
        caseId: notification.caseId || undefined,
        actionUrl: notification.actionUrl || undefined,
      },
    }).catch((error) => {
      logger.warn('Failed to send push notification for email reply', {
        error,
        userId: originalMessage.senderId,
        notificationId: notification.id,
      });
    });

    return NextResponse.json({
      success: true,
      processed: true,
      messageId: replyMessage.id,
      threadId,
    });
  } catch (error) {
    logger.error('Failed to process incoming email', {
      error: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json(
      { error: 'Failed to process incoming email', processed: false },
      { status: 500 }
    );
  }
};

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'incoming-email-webhook',
    timestamp: new Date().toISOString(),
    supports: ['mobile-app-json', 'email-forwarding-form-data'],
  });
}

// Export POST handler with middleware
export const POST = withCorsMiddleware(withRateLimit(postHandler, RateLimitPresets.STANDARD));
