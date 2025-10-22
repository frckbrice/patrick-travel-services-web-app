// GET /api/users/data-export - Export all user data (GDPR Right to Data Portability)
// Returns complete data dump including user info, cases, documents, messages, notifications
// Includes rate limiting (max 5 exports per day) and increments export counter

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// Custom rate limit for data export: max 5 exports per day
const DATA_EXPORT_RATE_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 5, // Max 5 exports per day
  message: 'Too many data export requests. Please try again in 24 hours.',
};

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const userId = req.user.userId;

  logger.info('Data export requested', { userId });

  // Fetch all user data in parallel for performance (mobile-first optimization)
  const [user, cases, documents, messages, notifications] = await Promise.all([
    // User data
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        // GDPR fields
        consentedAt: true,
        acceptedTerms: true,
        acceptedPrivacy: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        dataExportRequests: true,
        lastDataExport: true,
      },
    }),

    // All user's cases
    prisma.case.findMany({
      where: { clientId: userId },
      select: {
        id: true,
        referenceNumber: true,
        clientId: true,
        assignedAgentId: true,
        serviceType: true,
        status: true,
        priority: true,
        submissionDate: true,
        lastUpdated: true,
        estimatedCompletion: true,
      },
      orderBy: { submissionDate: 'desc' },
    }),

    // All user's documents
    prisma.document.findMany({
      where: { uploadedById: userId },
      select: {
        id: true,
        caseId: true,
        uploadedById: true,
        fileName: true,
        originalName: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        documentType: true,
        status: true,
        uploadDate: true,
        verifiedBy: true,
        verifiedAt: true,
      },
      orderBy: { uploadDate: 'desc' },
    }),

    // All user's messages (sent and received)
    prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        caseId: true,
        subject: true,
        content: true,
        isRead: true,
        readAt: true,
        sentAt: true,
        messageType: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 1000, // Limit to last 1000 messages for performance
    }),

    // All user's notifications
    prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        caseId: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        actionUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to last 500 notifications for performance
    }),
  ]);

  if (!user) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Update export counter and timestamp (background task, don't await)
  prisma.user
    .update({
      where: { id: userId },
      data: {
        dataExportRequests: { increment: 1 },
        lastDataExport: new Date(),
      },
    })
    .catch((error) => {
      logger.error('Failed to update export counter', { userId, error });
    });

  const exportedAt = new Date().toISOString();

  // Build GDPR-compliant data export response
  const exportData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    cases,
    documents,
    messages,
    notifications,
    consent: {
      consentedAt: user.consentedAt?.toISOString() || null,
      acceptedTerms: user.acceptedTerms ?? false,
      acceptedPrivacy: user.acceptedPrivacy ?? false,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() || null,
      privacyAcceptedAt: user.privacyAcceptedAt?.toISOString() || null,
    },
    exportedAt,
    format: 'json',
  };

  logger.info('Data export completed', {
    userId,
    casesCount: cases.length,
    documentsCount: documents.length,
    messagesCount: messages.length,
    notificationsCount: notifications.length,
  });

  return successResponse(exportData, 'Data exported successfully');
});

// Apply middleware: CORS -> Rate Limit (5 per day) -> Auth -> Handler
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), DATA_EXPORT_RATE_LIMIT)
);
