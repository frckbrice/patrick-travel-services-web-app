import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { NotificationType } from '@prisma/client';
import { sendUserEmail } from '@/lib/notifications/email.service';
import { logger } from '@/lib/utils/logger';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

// POST /api/emails/send - Send email (tracked in PostgreSQL)
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const { recipientId, caseId, subject, content, attachments } = body;

  // Validation
  if (!subject?.trim()) {
    throw new ApiError('Subject is required', HttpStatus.BAD_REQUEST);
  }

  if (!content?.trim()) {
    throw new ApiError('Message content is required', HttpStatus.BAD_REQUEST);
  }

  // Determine recipient based on user role
  let finalRecipientId = recipientId;
  let recipientEmail = '';
  let recipientName = '';
  let caseRef = '';

  if (req.user.role === 'CLIENT') {
    // Client sending email - must have a caseId
    if (!caseId) {
      throw new ApiError('Case selection is required for sending emails', HttpStatus.BAD_REQUEST);
    }

    // Get the case and its assigned agent (optimized query)
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        referenceNumber: true,
        clientId: true,
        assignedAgent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!caseRecord) {
      throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    // Verify client owns this case
    if (caseRecord.clientId !== req.user.userId) {
      throw new ApiError('Unauthorized access to case', HttpStatus.FORBIDDEN);
    }

    caseRef = caseRecord.referenceNumber;

    // Check if case has assigned agent
    if (caseRecord.assignedAgent) {
      finalRecipientId = caseRecord.assignedAgent.id;
      recipientEmail = caseRecord.assignedAgent.email;
      recipientName = `${caseRecord.assignedAgent.firstName} ${caseRecord.assignedAgent.lastName}`;
    } else {
      // No agent assigned - send to support email
      const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
      if (!supportEmail) {
        throw new ApiError('Support email not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Store with special 'support' recipientId
      finalRecipientId = 'support';
      recipientEmail = supportEmail;
      recipientName = 'Support Team';
    }
  } else {
    // Agent/Admin sending email - must specify recipient
    if (!recipientId) {
      throw new ApiError('Recipient is required', HttpStatus.BAD_REQUEST);
    }

    // Optimized query - only fetch needed fields
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!recipient) {
      throw new ApiError('Recipient not found', HttpStatus.NOT_FOUND);
    }

    recipientEmail = recipient.email;
    recipientName = `${recipient.firstName} ${recipient.lastName}`;
    finalRecipientId = recipient.id;

    // If caseId provided, get reference number
    if (caseId) {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        select: { referenceNumber: true },
      });
      if (caseData) {
        caseRef = caseData.referenceNumber;
      }
    }
  }

  // Generate unique thread ID for reply tracking
  const emailThreadId = `${Date.now()}-${req.user.userId}-${Math.random().toString(36).substring(7)}`;

  // Get sender info
  const sender = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!sender) {
    throw new ApiError('Sender not found', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  const senderName = `${sender.firstName} ${sender.lastName}`;

  // Save email to database (PostgreSQL for tracking)
  // Using Prisma.JsonValue for additional fields until migration is complete
  const message = await prisma.message.create({
    data: {
      senderId: req.user.userId,
      recipientId: finalRecipientId,
      caseId: caseId || null,
      subject,
      content,
      attachments: {
        messageType: 'EMAIL',
        emailThreadId,
        files: attachments || [],
      },
      isRead: false,
      sentAt: new Date(),
    },
  });

  // Send actual email (async - don't block response)
  try {
    await sendUserEmail({
      to: recipientEmail,
      from: senderName,
      fromEmail: sender.email,
      subject,
      content,
      threadId: emailThreadId,
      caseRef,
    });

    logger.info('Email sent successfully', {
      messageId: message.id,
      from: req.user.userId,
      to: finalRecipientId,
      threadId: emailThreadId,
    });
  } catch (emailError) {
    logger.error('Failed to send email', emailError);
    // Email failed but message is saved - mark content with error
    await prisma.message.update({
      where: { id: message.id },
      data: {
        content: `[EMAIL DELIVERY FAILED]\n\n${content}`,
      },
    });
  }

  // Create notification for recipient (leverage existing notification system)
  if (finalRecipientId && finalRecipientId !== 'support') {
    await prisma.notification.create({
      data: {
        userId: finalRecipientId,
        caseId: caseId || null,
        type: NotificationType.NEW_EMAIL,
        title: `New email from ${senderName}`,
        message: `Subject: ${subject.substring(0, 100)}${subject.length > 100 ? '...' : ''}`,
        isRead: false,
        actionUrl: '/dashboard/messages',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      message: {
        id: message.id,
        subject: message.subject,
        recipientName,
        sentAt: message.sentAt,
        threadId: emailThreadId,
      },
    },
    message: 'Email sent successfully',
  });
});

// Apply middleware: CORS, rate limiting, authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);

