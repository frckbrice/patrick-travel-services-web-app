// PATCH /api/documents/[id]/reject - Reject document (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { sendDocumentRejectedEmail } from '@/lib/notifications/email.service';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { escapeHtml } from '@/lib/utils/helpers';

// Type for document with case and client included
type DocumentWithCase = Prisma.DocumentGetPayload<{
  include: {
    case: {
      include: {
        client: true;
      };
    };
  };
}>;

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

    const body = await request.json();
    let reason = String(body.reason).trim();

    if (reason.length === 0 || reason.length > 500) {
      throw new ApiError(
        'Rejection reason must be a non-empty string up to 500 characters',
        HttpStatus.BAD_REQUEST
      );
    }

    // Sanitize to prevent XSS attacks in emails/notifications
    reason = escapeHtml(reason);

    // First, fetch the document to check existence and current status
    const existingDocument: DocumentWithCase | null = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        case: { include: { client: true } },
      },
    });

    if (!existingDocument) {
      throw new ApiError('Document not found', HttpStatus.NOT_FOUND);
    }

    // Check current status - only allow rejection if status is PENDING
    if (existingDocument.status === 'REJECTED') {
      // Idempotent: already rejected, return success without re-updating
      logger.info('Document already rejected (idempotent)', {
        documentId: params.id,
        rejectionReason: existingDocument.rejectionReason,
      });
      return successResponse({ document: existingDocument }, 'Document rejected successfully');
    }

    if (existingDocument.status !== 'PENDING') {
      throw new ApiError(
        `Cannot reject document with status '${existingDocument.status}'. Only documents with status 'PENDING' can be rejected.`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate that case and client exist before proceeding
    if (!existingDocument.case) {
      logger.error('Document has no associated case', { documentId: params.id });
      throw new ApiError('Document has no associated case', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!existingDocument.case.client) {
      logger.error('Document case has no associated client', {
        documentId: params.id,
        caseId: existingDocument.caseId,
      });
      throw new ApiError(
        'Document case has no associated client',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Update the document with rejection details
    const document: DocumentWithCase = await prisma.document.update({
      where: {
        id: params.id,
        status: 'PENDING', // Double-check status in where clause for safety
      },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
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
          await sendDocumentRejectedEmail(clientEmail, document.originalName, reason, clientName);
        } catch (emailError) {
          logger.warn('Failed to send email, but document rejected', emailError);
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
          type: 'DOCUMENT_REJECTED',
          title: 'Document Requires Reupload',
          message: `Your ${document.originalName} needs to be reuploaded. Reason: ${reason}`,
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

    logger.info('Document rejected', { documentId: params.id, rejectedBy: req.user.userId });

    return successResponse({ document }, 'Document rejected successfully');
  }
);

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
