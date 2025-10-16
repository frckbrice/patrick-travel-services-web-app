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
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

const handler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const req = request as AuthenticatedRequest;

    if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const body = await request.json();
    const { documentTypes, message } = body;

    if (!documentTypes || !Array.isArray(documentTypes) || documentTypes.length === 0) {
        throw new ApiError('Document types array is required', HttpStatus.BAD_REQUEST);
    }

    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        include: { client: true },
    });

    if (!caseData) {
        throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    await prisma.case.update({
        where: { id: params.id },
        data: { status: 'DOCUMENTS_REQUIRED' },
    });

    await prisma.statusHistory.create({
        data: {
            caseId: params.id,
            status: 'DOCUMENTS_REQUIRED',
            changedBy: req.user.userId,
            notes: `Requested: ${documentTypes.join(', ')}. ${message || ''}`,
        },
    });

    const docList = documentTypes.map((dt: string) => `<li>${dt.replace(/_/g, ' ')}</li>`).join('');

    try {
        await sendEmail({
            to: caseData.client.email,
            subject: `Documents Required for Case ${caseData.referenceNumber}`,
            html: `
                <h2>Documents Required</h2>
                <p>Dear ${caseData.client.firstName} ${caseData.client.lastName},</p>
                <p>To proceed with your case <strong>${caseData.referenceNumber}</strong>, we need:</p>
                <ul style="margin: 16px 0;">${docList}</ul>
                ${message ? `<p><strong>Note:</strong> ${message}</p>` : ''}
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents">Upload Documents</a>
                <p>Best regards,<br>Patrick Travel Services</p>
            `,
        });

        await createRealtimeNotification(caseData.clientId, {
            type: 'DOCUMENT_UPLOADED',
            title: 'Documents Required',
            message: `Please upload: ${documentTypes.join(', ')}`,
            actionUrl: '/dashboard/documents',
        });
    } catch (error) {
        logger.warn('Notification failed', error);
    }

    logger.info('Documents requested', { caseId: params.id, requestedBy: req.user.userId });

    return successResponse({ documentTypes }, 'Document request sent successfully');
});

export const POST = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));

