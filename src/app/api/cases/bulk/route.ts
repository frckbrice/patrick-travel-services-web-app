// Bulk Cases Operations API - POST (bulk assign, bulk status update)
// Admin only functionality for efficient case management

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// POST /api/cases/bulk - Bulk operations on cases
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  // Only ADMIN users can perform bulk operations
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const body = await request.json();
  const { operation, caseIds, data } = body;

  // Validation
  if (!operation || !Array.isArray(caseIds) || caseIds.length === 0) {
    throw new ApiError('operation and caseIds array are required', HttpStatus.BAD_REQUEST);
  }

  // Limit to prevent excessive operations
  if (caseIds.length > 100) {
    throw new ApiError('Cannot process more than 100 cases at once', HttpStatus.BAD_REQUEST);
  }

  let result;

  switch (operation) {
    case 'ASSIGN':
      // Bulk assign cases to an agent
      if (!data?.assignedAgentId) {
        throw new ApiError(
          'assignedAgentId is required for ASSIGN operation',
          HttpStatus.BAD_REQUEST
        );
      }

      // Verify agent exists and has AGENT role
      const agent = await prisma.user.findUnique({
        where: { id: data.assignedAgentId },
      });

      if (!agent || agent.role !== 'AGENT') {
        throw new ApiError('Invalid agent ID or user is not an agent', HttpStatus.BAD_REQUEST);
      }

      result = await prisma.case.updateMany({
        where: {
          id: { in: caseIds },
        },
        data: {
          assignedAgentId: data.assignedAgentId,
        },
      });

      // Create activity logs for bulk assignment
      await prisma.activityLog.createMany({
        data: caseIds.map((caseId: string) => ({
          userId: req.user!.userId,
          action: 'CASE_ASSIGNED',
          description: `Case assigned to agent via bulk operation`,
          entityType: 'CASE',
          entityId: caseId,
          details: JSON.stringify({
            assignedTo: data.assignedAgentId,
            bulkOperation: true,
          }),
        })),
      });

      logger.info('Bulk case assignment completed', {
        userId: req.user.userId,
        agentId: data.assignedAgentId,
        count: result.count,
      });

      return successResponse(
        { updatedCount: result.count },
        `${result.count} cases assigned successfully`
      );

    case 'UPDATE_STATUS':
      // Bulk update case status
      if (!data?.status) {
        throw new ApiError(
          'status is required for UPDATE_STATUS operation',
          HttpStatus.BAD_REQUEST
        );
      }

      const validStatuses = [
        'SUBMITTED',
        'UNDER_REVIEW',
        'DOCUMENTS_REQUIRED',
        'PROCESSING',
        'APPROVED',
        'REJECTED',
        'CLOSED',
      ];
      if (!validStatuses.includes(data.status)) {
        throw new ApiError('Invalid status value', HttpStatus.BAD_REQUEST);
      }

      result = await prisma.case.updateMany({
        where: {
          id: { in: caseIds },
        },
        data: {
          status: data.status,
          ...(data.status === 'APPROVED' && { approvedAt: new Date() }),
          ...(data.status === 'CLOSED' && { completedAt: new Date() }),
        },
      });

      // Create activity logs for bulk status update
      await prisma.activityLog.createMany({
        data: caseIds.map((caseId: string) => ({
          userId: req.user!.userId,
          action: 'CASE_STATUS_UPDATED',
          description: `Case status updated to ${data.status} via bulk operation`,
          entityType: 'CASE',
          entityId: caseId,
          details: JSON.stringify({
            newStatus: data.status,
            bulkOperation: true,
          }),
        })),
      });

      logger.info('Bulk case status update completed', {
        userId: req.user.userId,
        status: data.status,
        count: result.count,
      });

      return successResponse(
        { updatedCount: result.count },
        `${result.count} cases updated successfully`
      );

    case 'UPDATE_PRIORITY':
      // Bulk update case priority
      if (!data?.priority) {
        throw new ApiError(
          'priority is required for UPDATE_PRIORITY operation',
          HttpStatus.BAD_REQUEST
        );
      }

      const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(data.priority)) {
        throw new ApiError('Invalid priority value', HttpStatus.BAD_REQUEST);
      }

      result = await prisma.case.updateMany({
        where: {
          id: { in: caseIds },
        },
        data: {
          priority: data.priority,
        },
      });

      logger.info('Bulk case priority update completed', {
        userId: req.user.userId,
        priority: data.priority,
        count: result.count,
      });

      return successResponse(
        { updatedCount: result.count },
        `${result.count} cases updated successfully`
      );

    default:
      throw new ApiError('Invalid operation', HttpStatus.BAD_REQUEST);
  }
});

// Apply middleware and authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STRICT)
);
