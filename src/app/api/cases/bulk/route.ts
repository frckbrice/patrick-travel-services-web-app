// Bulk Cases Operations API - POST (bulk assign, bulk status update)
// Admin only functionality for efficient case management

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, NOTIFICATION_ACTION_URLS } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { sendPushNotificationToUser } from '@/lib/notifications/expo-push.service';

// POST /api/cases/bulk - Bulk operations on cases
// ADMIN ONLY: Agents cannot assign/unassign cases
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  // SECURITY: Only ADMIN users can perform bulk operations (assign/unassign cases)
  // Agents can only view cases assigned to them, never assign or unassign
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError(
      'Only administrators can perform bulk operations on cases',
      HttpStatus.FORBIDDEN
    );
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

  let result: { count: number };

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

      // Fetch full case details for notifications (efficient: single query with all relations)
      const casesToAssign = await prisma.case.findMany({
        where: { id: { in: caseIds } },
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update all cases
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

      // PERFORMANCE: Send notifications asynchronously (non-blocking)
      // Only send push notifications (not emails) for bulk to avoid overwhelming
      const agentFullName = `${agent.firstName} ${agent.lastName}`;
      const notificationPromises: Promise<any>[] = [];

      // 1. Notify agent once about bulk assignment (consolidated notification)
      notificationPromises.push(
        createRealtimeNotification(data.assignedAgentId, {
          type: 'CASE_ASSIGNED',
          title: 'Bulk Cases Assigned',
          message: `${result.count} cases have been assigned to you`,
          actionUrl: NOTIFICATION_ACTION_URLS.CASES_MY_CASES,
        }),
        sendPushNotificationToUser(data.assignedAgentId, {
          title: '🎯 Bulk Assignment',
          body: `${result.count} cases have been assigned to you. Check your dashboard.`,
          data: {
            type: 'BULK_CASE_ASSIGNED',
            count: result.count,
            agentId: data.assignedAgentId,
          },
        })
      );

      // 2. Notify each client individually (batched for performance)
      for (const caseItem of casesToAssign) {
        const clientFullName = `${caseItem.client.firstName} ${caseItem.client.lastName}`;

        notificationPromises.push(
          createRealtimeNotification(caseItem.clientId, {
            type: 'CASE_ASSIGNED',
            title: 'Case Assigned',
            message: `Your case ${caseItem.referenceNumber} has been assigned to ${agentFullName}`,
            actionUrl: NOTIFICATION_ACTION_URLS.CASE_DETAILS(caseItem.id),
          }),
          sendPushNotificationToUser(caseItem.clientId, {
            title: '👤 Case Assigned',
            body: `Your case ${caseItem.referenceNumber} has been assigned to ${agentFullName}`,
            data: {
              type: 'CASE_ASSIGNED',
              caseId: caseItem.id,
              caseRef: caseItem.referenceNumber,
              agentId: data.assignedAgentId,
              agentName: agentFullName,
            },
          })
        );
      }

      // Execute all notifications in background (don't wait, don't block response)
      Promise.all(notificationPromises)
        .then(() => {
          logger.info('Bulk assignment notifications sent', {
            agentId: data.assignedAgentId,
            casesCount: result.count,
          });
        })
        .catch((error) => {
          logger.error('Failed to send bulk assignment notifications', error, {
            agentId: data.assignedAgentId,
            casesCount: result.count,
          });
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

    case 'UNASSIGN':
      // Bulk unassign cases (remove agent assignment)
      // Fetch cases with current assignments for notifications
      const casesToUnassign = await prisma.case.findMany({
        where: {
          id: { in: caseIds },
          assignedAgentId: { not: null }, // Only unassign cases that have agents
        },
        include: {
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (casesToUnassign.length === 0) {
        return successResponse({ updatedCount: 0 }, 'No assigned cases found to unassign');
      }

      // Group cases by agent for efficient notifications
      const casesByAgent = new Map<string, typeof casesToUnassign>();
      for (const caseItem of casesToUnassign) {
        if (caseItem.assignedAgentId) {
          const existing = casesByAgent.get(caseItem.assignedAgentId) || [];
          casesByAgent.set(caseItem.assignedAgentId, [...existing, caseItem]);
        }
      }

      // Unassign all cases
      result = await prisma.case.updateMany({
        where: {
          id: { in: casesToUnassign.map((c) => c.id) },
        },
        data: {
          assignedAgentId: null,
        },
      });

      // Create activity logs
      await prisma.activityLog.createMany({
        data: casesToUnassign.map((caseItem) => ({
          userId: req.user!.userId,
          action: 'CASE_UNASSIGNED',
          description: `Case unassigned from agent via bulk operation`,
          entityType: 'CASE',
          entityId: caseItem.id,
          details: JSON.stringify({
            previousAgent: caseItem.assignedAgentId,
            bulkOperation: true,
          }),
        })),
      });

      // PERFORMANCE: Send notifications asynchronously
      const unassignNotifications: Promise<any>[] = [];

      // Notify each affected agent (consolidated per agent)
      for (const [agentId, agentCases] of casesByAgent.entries()) {
        const agentData = agentCases[0].assignedAgent!;
        const agentName = `${agentData.firstName} ${agentData.lastName}`;

        unassignNotifications.push(
          createRealtimeNotification(agentId, {
            type: 'CASE_UNASSIGNED',
            title: 'Cases Unassigned',
            message: `${agentCases.length} case${agentCases.length > 1 ? 's have' : ' has'} been unassigned from you`,
            actionUrl: NOTIFICATION_ACTION_URLS.CASES_LIST,
          }),
          sendPushNotificationToUser(agentId, {
            title: '📤 Cases Unassigned',
            body: `${agentCases.length} case${agentCases.length > 1 ? 's have' : ' has'} been unassigned from you`,
            data: {
              type: 'BULK_CASE_UNASSIGNED',
              count: agentCases.length,
            },
          })
        );

        // Notify each client
        for (const caseItem of agentCases) {
          const clientName = `${caseItem.client.firstName} ${caseItem.client.lastName}`;

          unassignNotifications.push(
            createRealtimeNotification(caseItem.clientId, {
              type: 'CASE_UNASSIGNED',
              title: 'Case Update',
              message: `Your case ${caseItem.referenceNumber} is being reassigned. A new agent will be assigned soon.`,
              actionUrl: NOTIFICATION_ACTION_URLS.CASE_DETAILS(caseItem.id),
            }),
            sendPushNotificationToUser(caseItem.clientId, {
              title: '🔄 Case Update',
              body: `Your case ${caseItem.referenceNumber} is being reassigned to another agent`,
              data: {
                type: 'CASE_UNASSIGNED',
                caseId: caseItem.id,
                caseRef: caseItem.referenceNumber,
              },
            })
          );
        }
      }

      // Execute notifications in background
      Promise.all(unassignNotifications)
        .then(() => {
          logger.info('Bulk unassignment notifications sent', {
            casesCount: result.count,
            agentsAffected: casesByAgent.size,
          });
        })
        .catch((error) => {
          logger.error('Failed to send bulk unassignment notifications', error);
        });

      logger.info('Bulk case unassignment completed', {
        userId: req.user.userId,
        count: result.count,
        agentsAffected: casesByAgent.size,
      });

      return successResponse(
        { updatedCount: result.count },
        `${result.count} cases unassigned successfully`
      );

    default:
      throw new ApiError('Invalid operation', HttpStatus.BAD_REQUEST);
  }
});

// Apply middleware and authentication
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STRICT)
);
