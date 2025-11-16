import { NextRequest } from 'next/server';
import { addMinutes } from 'date-fns';

import { prisma } from '@/lib/db/prisma';
import { AppointmentStatus } from '@prisma/client';
import { ERROR_MESSAGES, NOTIFICATION_ACTION_URLS } from '@/lib/constants';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const now = new Date();
  const edgeBuffer = addMinutes(now, -5);

  const role = req.user.role;
  const activeStatuses: AppointmentStatus[] = ['SCHEDULED', 'RESCHEDULED'];
  const whereClause =
    role === 'CLIENT'
      ? {
          clientId: req.user.userId,
          scheduledAt: { gte: edgeBuffer },
          status: { in: activeStatuses },
        }
      : role === 'AGENT'
        ? {
            assignedAgentId: req.user.userId,
            scheduledAt: { gte: edgeBuffer },
            status: { in: activeStatuses },
          }
        : {
            scheduledAt: { gte: edgeBuffer },
            status: { in: activeStatuses },
          };

  const appointment = await prisma.appointment.findFirst({
    where: whereClause,
    orderBy: { scheduledAt: 'asc' },
    include: {
      case: {
        select: {
          id: true,
          referenceNumber: true,
          status: true,
        },
      },
      assignedAgent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return successResponse(
    {
      appointment: appointment
        ? {
            ...appointment,
            actionUrl: NOTIFICATION_ACTION_URLS.APPOINTMENT_DETAILS(
              appointment.caseId,
              appointment.id
            ),
          }
        : null,
    },
    appointment ? 'Upcoming appointment retrieved successfully' : 'No upcoming appointments'
  );
});

export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
