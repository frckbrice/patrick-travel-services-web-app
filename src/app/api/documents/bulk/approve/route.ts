// POST /api/documents/bulk/approve - Bulk approve documents (AGENT/ADMIN only)

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

const handler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        throw new ApiError('Document IDs array is required', HttpStatus.BAD_REQUEST);
    }

    await prisma.document.updateMany({
        where: { id: { in: documentIds }, status: 'PENDING' },
        data: {
            status: 'APPROVED',
            verifiedBy: req.user.userId,
            verifiedAt: new Date(),
        },
    });

    const updatedDocs = await prisma.document.findMany({
        where: { id: { in: documentIds } },
        include: { case: { include: { client: true } } },
    });

    const clientDocs = new Map<string, typeof updatedDocs>();
    updatedDocs.forEach((doc: typeof updatedDocs[number]) => {
        const clientId = doc.case.clientId;
        if (!clientDocs.has(clientId)) clientDocs.set(clientId, []);
        clientDocs.get(clientId)?.push(doc);
    });

    for (const [clientId, docs] of clientDocs.entries()) {
        const client = docs[0].case.client;
        const docNames = docs.map((d: typeof updatedDocs[number]) => d.originalName).join(', ');

        try {
            await Promise.all([
                sendDocumentVerifiedEmail(client.email, docNames, `${client.firstName} ${client.lastName}`),
                createRealtimeNotification(clientId, {
                    type: 'DOCUMENT_VERIFIED',
                    title: `${docs.length} Document(s) Approved`,
                    message: `Approved: ${docNames}`,
                    actionUrl: '/dashboard/documents',
                }),
            ]);
        } catch (error) {
            logger.warn('Notification failed', error);
        }
    }

    logger.info('Bulk approved', { count: updatedDocs.length, by: req.user.userId });

    return successResponse({ count: updatedDocs.length }, `${updatedDocs.length} documents approved`);
});

export const POST = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));

