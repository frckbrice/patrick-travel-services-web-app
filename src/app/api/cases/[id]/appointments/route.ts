import { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, NOTIFICATION_ACTION_URLS, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { formatDateTime } from '@/lib/utils/helpers';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { sendPushNotificationToUser } from '@/lib/notifications/expo-push.service';
import { sendAppointmentScheduledEmail } from '@/lib/notifications/email.service';

const createAppointmentSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, 'scheduledAt is required')
    .refine(
      (value) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
      },
      { message: 'scheduledAt must be a valid date' }
    ),
  location: z.string().trim().min(1).max(255),
  notes: z.string().trim().max(2000).optional(),
  assignedAgentId: z.string().uuid().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

const appointmentInclude = {
  assignedAgent: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
};

// GET /api/cases/[id]/appointments - List appointments for a case
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;
  const { id: caseId } = await context.params;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      clientId: true,
      assignedAgentId: true,
    },
  });

  if (!caseRecord) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (req.user.role === 'CLIENT' && caseRecord.clientId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  if (req.user.role === 'AGENT' && caseRecord.assignedAgentId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const appointments = await prisma.appointment.findMany({
    where: { caseId },
    orderBy: { scheduledAt: 'asc' },
    include: appointmentInclude,
  });

  logger.info('Appointments retrieved', {
    caseId,
    count: appointments.length,
    requestedBy: req.user.userId,
  });

  return successResponse({ appointments }, 'Appointments retrieved successfully');
});

// POST /api/cases/[id]/appointments - Create appointment (AGENT/ADMIN only)
const postHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;
  const { id: caseId } = await context.params;

  if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const body = await request.json();
  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      parsed.error.issues.map((issue) => issue.message).join(', '),
      HttpStatus.BAD_REQUEST
    );
  }

  const { scheduledAt, location, notes, assignedAgentId } = parsed.data;
  const scheduledDate = new Date(scheduledAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new ApiError('Invalid scheduledAt value', HttpStatus.BAD_REQUEST);
  }

  if (scheduledDate.getTime() <= Date.now()) {
    throw new ApiError('Appointment must be scheduled in the future', HttpStatus.BAD_REQUEST);
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
      clientId: true,
      assignedAgentId: true,
      referenceNumber: true,
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      assignedAgent: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  if (!caseRecord) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (caseRecord.status !== 'APPROVED') {
    throw new ApiError(
      'Appointments can only be scheduled when a case is approved',
      HttpStatus.BAD_REQUEST
    );
  }

  if (req.user.role === 'AGENT' && caseRecord.assignedAgentId !== req.user.userId) {
    throw new ApiError(
      'Only the assigned agent or an administrator can schedule appointments for this case',
      HttpStatus.FORBIDDEN
    );
  }

  let appointmentAgentId = assignedAgentId || caseRecord.assignedAgentId || req.user.userId;
  let appointmentAgent = caseRecord.assignedAgent;

  if (assignedAgentId && assignedAgentId !== caseRecord.assignedAgentId) {
    appointmentAgent = await prisma.user.findUnique({
      where: { id: assignedAgentId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!appointmentAgent) {
      throw new ApiError('Assigned agent not found', HttpStatus.BAD_REQUEST);
    }

    if (!['AGENT', 'ADMIN'].includes(appointmentAgent.role)) {
      throw new ApiError('Assigned agent must be an agent or admin user', HttpStatus.BAD_REQUEST);
    }
  }

  if (!appointmentAgentId) {
    appointmentAgentId = req.user.userId;
  }

  const appointment = await prisma.appointment.create({
    data: {
      caseId,
      clientId: caseRecord.clientId,
      createdById: req.user.userId,
      assignedAgentId: appointmentAgentId,
      scheduledAt: scheduledDate,
      location,
      notes: notes && notes.length > 0 ? notes : undefined,
    },
    include: {
      ...appointmentInclude,
      case: {
        select: {
          id: true,
          referenceNumber: true,
        },
      },
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

  const appointmentActionUrl = NOTIFICATION_ACTION_URLS.APPOINTMENT_DETAILS(
    caseRecord.id,
    appointment.id
  );
  const appointmentTimeLabel = formatDateTime(appointment.scheduledAt);

  const notification = await prisma.notification.create({
    data: {
      userId: caseRecord.clientId,
      caseId: caseRecord.id,
      appointmentId: appointment.id,
      type: 'APPOINTMENT_SCHEDULED',
      title: 'Appointment Scheduled',
      message: `Your appointment for case ${caseRecord.referenceNumber} is scheduled for ${appointmentTimeLabel} at ${location}.`,
      actionUrl: appointmentActionUrl,
    },
  });

  const clientName =
    `${appointment.client?.firstName ?? ''} ${appointment.client?.lastName ?? ''}`.trim() ||
    appointment.client?.email ||
    'Client';

  const advisorName = appointment.assignedAgent
    ? `${appointment.assignedAgent.firstName ?? ''} ${appointment.assignedAgent.lastName ?? ''}`.trim()
    : appointment.createdBy
      ? `${appointment.createdBy.firstName ?? ''} ${appointment.createdBy.lastName ?? ''}`.trim()
      : undefined;

  Promise.allSettled([
    (async () => {
      try {
        await createRealtimeNotification(caseRecord.clientId, {
          type: 'APPOINTMENT_SCHEDULED',
          title: 'Appointment Scheduled',
          message: `An appointment has been scheduled for ${appointmentTimeLabel} at ${location}.`,
          actionUrl: appointmentActionUrl,
        });
      } catch (error) {
        logger.warn('Failed to create realtime notification for appointment', {
          error,
          appointmentId: appointment.id,
        });
      }
    })(),
    (async () => {
      try {
        let badge: number | undefined;
        try {
          const unread = await prisma.notification.count({
            where: { userId: caseRecord.clientId, isRead: false },
          });
          badge = unread > 0 ? unread : undefined;
        } catch (error) {
          logger.debug('Failed to fetch unread notification count', {
            error:
              error instanceof Error
                ? error.message
                : typeof error === 'string'
                  ? error
                  : 'unknown',
          });
        }

        await sendPushNotificationToUser(caseRecord.clientId, {
          title: 'Appointment Scheduled',
          body: `Your appointment is set for ${appointmentTimeLabel}.`,
          data: {
            type: 'APPOINTMENT_SCHEDULED',
            appointmentId: appointment.id,
            caseId: caseRecord.id,
            notificationId: notification.id,
            actionUrl: appointmentActionUrl,
            screen: 'cases',
            params: { caseId: caseRecord.id, appointmentId: appointment.id },
          },
          badge,
          channelId: 'cases',
        });
      } catch (error) {
        logger.warn('Failed to send push notification for appointment', {
          error,
          appointmentId: appointment.id,
        });
      }
    })(),
    (async () => {
      try {
        if (appointment.client?.email) {
          await sendAppointmentScheduledEmail({
            to: appointment.client.email,
            clientName,
            caseReference: caseRecord.referenceNumber,
            caseId: caseRecord.id,
            appointmentId: appointment.id,
            scheduledAt: appointment.scheduledAt.toISOString(),
            location: appointment.location,
            advisorName,
            notes: appointment.notes ?? undefined,
          });
        }
      } catch (error) {
        logger.warn('Failed to send appointment email notification', {
          error,
          appointmentId: appointment.id,
        });
      }
    })(),
  ]).catch((error) => {
    logger.error('Unhandled error while dispatching appointment notifications', error);
  });

  return successResponse({ appointment }, SUCCESS_MESSAGES.CREATED, HttpStatus.CREATED);
});

export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
