// POST /api/cases/[id]/request-documents - Request specific documents from client (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/notifications/email.service';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { escapeHtml } from '@/lib/utils/helpers';

const handler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const req = request as AuthenticatedRequest;
    const params = await context.params;

    if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
      throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    // Validate that NEXT_PUBLIC_APP_URL is configured before processing
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new ApiError('Application URL not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const body = await request.json();
    const { documentTypes, message } = body;

    if (!documentTypes || !Array.isArray(documentTypes) || documentTypes.length === 0) {
      throw new ApiError('Document types array is required', HttpStatus.BAD_REQUEST);
    }

    // Validate each document type
    for (const docType of documentTypes) {
      if (typeof docType !== 'string' || docType.trim().length === 0) {
        throw new ApiError('Invalid document type', HttpStatus.BAD_REQUEST);
      }
      if (docType.length > 100) {
        throw new ApiError('Document type too long', HttpStatus.BAD_REQUEST);
      }
    }

    // Check if case exists and fetch with client details
    const existingCase = await prisma.case.findUnique({
      where: { id: params?.id },
      include: {
        client: true,
      },
    });

    if (!existingCase) {
      throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    const caseData = await prisma
      .$transaction([
        prisma.case.update({
          where: { id: params.id },
          data: { status: 'DOCUMENTS_REQUIRED' },
          include: {
            client: true,
          },
        }),
        prisma.statusHistory.create({
          data: {
            caseId: params.id,
            status: 'DOCUMENTS_REQUIRED',
            changedBy: req.user.userId,
            notes: `Requested: ${documentTypes.join(', ')}. ${message || ''}`,
          },
        }),
      ])
      .then(([updatedCase]) => updatedCase);

    // Escape all user-controlled content before injecting into HTML to prevent XSS
    const docList = documentTypes
      .map((dt: string) => `<li>${escapeHtml(dt.replace(/_/g, ' '))}</li>`)
      .join('');

    // Send email notification (critical operation)
    try {
      await sendEmail({
        to: caseData.client.email,
        subject: `Documents Required for Case ${escapeHtml(caseData.referenceNumber)}`,
        html: `
                <h2>Documents Required</h2>
                <p>Dear ${escapeHtml(caseData.client.firstName)} ${escapeHtml(caseData.client.lastName)},</p>
                <p>To proceed with your case <strong>${escapeHtml(caseData.referenceNumber)}</strong>, we need:</p>
                <ul style="margin: 16px 0;">${docList}</ul>
                ${message ? `<p><strong>Note:</strong> ${escapeHtml(message)}</p>` : ''}
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents">Upload Documents</a>
                <p>Best regards,<br>Patrick Travel Services</p>
            `,
      });
    } catch (error) {
      logger.error('Failed to send document request email', { caseId: params.id, error });
      throw error; // Propagate error to caller
    }

    // Send realtime notification (optional operation)
    try {
      await createRealtimeNotification(caseData.clientId, {
        type: 'DOCUMENT_REQUESTED',
        title: 'Documents Required',
        message: `Please upload: ${documentTypes.join(', ')}`,
        actionUrl: '/dashboard/documents',
      });
    } catch (error) {
      logger.warn('Realtime notification failed', { caseId: params.id, error });
    }

    logger.info('Documents requested', { caseId: params.id, requestedBy: req.user.userId });

    return successResponse({ documentTypes }, 'Document request sent successfully');
  }
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
