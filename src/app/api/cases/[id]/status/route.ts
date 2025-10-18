// PATCH /api/cases/[id]/status - Update case status (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { sendCaseStatusEmail } from '@/lib/notifications/email.service';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

const handler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;

    const req = request as AuthenticatedRequest;

    if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
      throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'] as const;

    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      throw new ApiError('Status is required', HttpStatus.BAD_REQUEST);
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new ApiError('Invalid status value', HttpStatus.BAD_REQUEST);
    }

    // Fetch case for resource-level authorization
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
      select: { assignedAgentId: true },
    });

    if (!existingCase) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Resource-level authorization: only ADMIN or the assigned agent can update status
    if (req.user.role !== 'ADMIN') {
      if (existingCase.assignedAgentId !== req.user.userId) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
      }
    }

    const caseData = await prisma.case.update({
      where: { id: params.id },
      data: { status },
      include: { client: true },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        caseId: params.id,
        status,
        changedBy: req.user.userId,
        notes: note,
      },
    });

    // Send notifications
    try {
      // Compute a safe display name for the client
      const firstNamePart = (caseData.client.firstName || '').trim();
      const lastNamePart = (caseData.client.lastName || '').trim();
      const nameParts = [firstNamePart, lastNamePart].filter((part) => part.length > 0);
      const clientDisplayName =
        nameParts.length > 0 ? nameParts.join(' ') : caseData.client.email || 'Client';

      await Promise.all([
        sendCaseStatusEmail(
          caseData.client.email,
          caseData.referenceNumber,
          status,
          clientDisplayName
        ),
        createRealtimeNotification(caseData.clientId, {
          type: 'CASE_STATUS_UPDATE',
          title: 'Case Status Updated',
          message: `Your case ${caseData.referenceNumber} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
          actionUrl: `/dashboard/cases/${params.id}`,
        }),
      ]);
    } catch (error) {
      logger.warn('Notification failed but status updated', error);
    }

    logger.info('Case status updated', { caseId: params.id, status, updatedBy: req.user.userId });

    return successResponse({ case: caseData }, 'Status updated successfully');
  }
);

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
