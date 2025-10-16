// PATCH /api/cases/[id]/assign - Assign case to another agent (ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

const handler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const req = request as AuthenticatedRequest;

    if (!req.user || req.user.role !== 'ADMIN') {
        throw new ApiError('Only administrators can assign cases', HttpStatus.FORBIDDEN);
    }

    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
        throw new ApiError('Agent ID is required', HttpStatus.BAD_REQUEST);
    }

    // Verify agent exists and has AGENT role
    const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!agent || agent.role !== 'AGENT') {
        throw new ApiError('Invalid agent ID', HttpStatus.BAD_REQUEST);
    }

    const caseData = await prisma.case.update({
        where: { id: params.id },
        data: { assignedAgentId: agentId },
        include: { client: true },
    });

    // Notify the assigned agent
    try {
        await createRealtimeNotification(agentId, {
            type: 'CASE_ASSIGNED',
            title: 'New Case Assigned',
            message: `Case ${caseData.referenceNumber} has been assigned to you`,
            actionUrl: `/dashboard/cases/${params.id}`,
        });
    } catch (error) {
        logger.warn('Failed to notify agent', error);
    }

    logger.info('Case assigned', { caseId: params.id, agentId, assignedBy: req.user.userId });

    return successResponse({ case: caseData }, 'Case assigned successfully');
});

export const PATCH = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));

