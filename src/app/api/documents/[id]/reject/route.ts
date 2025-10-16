// PATCH /api/documents/[id]/reject - Reject document (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { sendDocumentRejectedEmail } from '@/lib/notifications/email.service';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

const handler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const req = request as AuthenticatedRequest;
    
    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    if (!['AGENT', 'ADMIN'].includes(req.user.role)) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
        throw new ApiError('Rejection reason is required', HttpStatus.BAD_REQUEST);
    }

    const document = await prisma.document.update({
        where: { id: params.id },
        data: {
            status: 'REJECTED',
            rejectionReason: reason,
            verifiedBy: req.user.userId,
            verifiedAt: new Date(),
        },
        include: {
            case: { include: { client: true } },
        },
    });

    // Send email
    try {
        await sendDocumentRejectedEmail(
            document.case.client.email,
            document.originalName,
            reason,
            `${document.case.client.firstName} ${document.case.client.lastName}`
        );
    } catch (emailError) {
        logger.warn('Failed to send email', emailError);
    }

    // Send real-time notification
    try {
        await createRealtimeNotification(document.case.clientId, {
            type: 'DOCUMENT_REJECTED',
            title: 'Document Requires Reupload',
            message: `Your ${document.originalName} needs to be reuploaded. Reason: ${reason}`,
            actionUrl: '/dashboard/documents',
        });
    } catch (notifError) {
        logger.warn('Failed to send notification', notifError);
    }

    logger.info('Document rejected', { documentId: params.id, rejectedBy: req.user.userId });

    return successResponse({ document }, 'Document rejected');
});

export const PATCH = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));
