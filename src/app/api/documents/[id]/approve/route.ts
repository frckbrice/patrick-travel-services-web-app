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

const handler = asyncHandler(async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    const params = await context?.params;

    if (!params) {
        throw new ApiError('Invalid request parameters', HttpStatus.BAD_REQUEST);
    }
    const req = request as AuthenticatedRequest;
    
    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    if (!['AGENT', 'ADMIN'].includes(req.user.role)) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const document = await prisma.document.update({
        where: { id: params.id },
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
    try {
        await sendDocumentVerifiedEmail(
            document.case.client.email,
            document.originalName,
            `${document.case.client.firstName} ${document.case.client.lastName}`
        );
    } catch (emailError) {
        logger.warn('Failed to send email, but document approved', emailError);
    }

    // Send real-time notification
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

    logger.info('Document approved', { documentId: params.id, approvedBy: req.user.userId });

    return successResponse({ document }, 'Document approved successfully');
});

export const PATCH = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));
