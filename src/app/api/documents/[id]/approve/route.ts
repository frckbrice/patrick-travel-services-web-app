// PATCH /api/documents/[id]/approve - Approve document (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { sendDocumentVerifiedEmail } from '@/lib/notifications/email.service';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

const handler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;
    const req = request as AuthenticatedRequest;

    if (!req.user) {
      throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    if (!['AGENT', 'ADMIN'].includes(req.user.role)) {
      throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    // First, fetch the document to check existence and current status
    const existingDocument = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        case: { include: { client: true } },
      },
    });

    if (!existingDocument) {
      throw new ApiError('Document not found', HttpStatus.NOT_FOUND);
    }

    // Check current status for idempotency and validation
    if (existingDocument.status === 'APPROVED') {
      // Idempotent: already approved, return success without re-updating
      logger.info('Document already approved (idempotent)', {
        documentId: params.id,
        verifiedBy: existingDocument.verifiedBy,
      });
      return successResponse({ document: existingDocument }, 'Document approved successfully');
    }

    if (existingDocument.status === 'REJECTED') {
      throw new ApiError('Cannot approve a rejected document', HttpStatus.BAD_REQUEST);
    }

    // Update only if status is PENDING
    const document = await prisma.document.update({
      where: {
        id: params.id,
        status: 'PENDING', // Double-check status in where clause for safety
      },
      data: {
        status: 'APPROVED',
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
      },
      include: {
        case: { include: { client: true } },
      },
    });

    // Send email notification
    if (document.case && document.case.client) {
      const client = document.case.client;
      const clientEmail = client.email;
      const clientName =
        client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : null;

      if (clientEmail && clientName) {
        try {
          await sendDocumentVerifiedEmail(clientEmail, document.originalName, clientName);
        } catch (emailError) {
          logger.warn('Failed to send email, but document approved', emailError);
        }
      } else {
        const missingFields = [];
        if (!clientEmail) missingFields.push('client.email');
        if (!clientName) missingFields.push('client.firstName or client.lastName');
        logger.warn('Skipping email notification due to missing client data', {
          documentId: params.id,
          missingFields: missingFields.join(', '),
        });
      }
    } else {
      const missingFields = [];
      if (!document.case) missingFields.push('case');
      if (document.case && !document.case.client) missingFields.push('case.client');
      logger.warn('Skipping email notification due to missing case/client data', {
        documentId: params.id,
        missingFields: missingFields.join(', '),
      });
    }

    // Send real-time notification
    if (document.case && document.case.clientId) {
      try {
        await createRealtimeNotification(document.case.clientId, {
          type: 'DOCUMENT_VERIFIED',
          title: 'Document Approved',
          message: `Your ${document.originalName} has been verified and approved`,
          actionUrl: '/dashboard/documents',
        });
      } catch (notifError) {
        logger.warn('Failed to send realtime notification', notifError);
      }
    } else {
      const missingFields = [];
      if (!document.case) missingFields.push('case');
      if (document.case && !document.case.clientId) missingFields.push('case.clientId');
      logger.warn('Skipping realtime notification due to missing case/client data', {
        documentId: params.id,
        missingFields: missingFields.join(', '),
      });
    }

    logger.info('Document approved', { documentId: params.id, approvedBy: req.user.userId });

    return successResponse({ document }, 'Document approved successfully');
  }
);

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
