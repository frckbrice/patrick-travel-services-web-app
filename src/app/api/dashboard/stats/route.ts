// GET /api/dashboard/stats - Get dashboard statistics (role-specific)
// Returns efficient counts instead of fetching all records

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// Terminal case statuses (end states)
const TERMINAL_STATUSES: ('APPROVED' | 'REJECTED' | 'CLOSED')[] = [
  'APPROVED',
  'REJECTED',
  'CLOSED',
];
const CASE_STATUS_APPROVED = 'APPROVED' as const;

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const userId = req.user.userId;
  const role = req.user.role;

  // PERFORMANCE: Use database COUNT queries instead of fetching all records
  if (role === 'CLIENT') {
    // Client statistics - only their own cases
    const where = { clientId: userId };

    const [totalCases, activeCases, completedCases, pendingDocuments] = await Promise.all([
      // Total cases
      prisma.case.count({ where }),

      // Active cases (not in terminal status)
      prisma.case.count({
        where: {
          ...where,
          status: { notIn: TERMINAL_STATUSES },
        },
      }),

      // Completed cases
      prisma.case.count({
        where: {
          ...where,
          status: CASE_STATUS_APPROVED,
        },
      }),

      // Pending documents
      prisma.document.count({
        where: {
          uploadedById: userId,
          status: 'PENDING',
        },
      }),
    ]);

    return successResponse({
      totalCases,
      activeCases,
      completedCases,
      pendingDocuments,
    });
  } else if (role === 'AGENT') {
    // Agent statistics - their assigned cases
    const [totalCases, activeCases, completedCases, assignedCases] = await Promise.all([
      // Total cases (all cases visible to agent)
      prisma.case.count({}),

      // Active cases (not in terminal status)
      prisma.case.count({
        where: { status: { notIn: TERMINAL_STATUSES } },
      }),

      // Completed cases
      prisma.case.count({
        where: { status: CASE_STATUS_APPROVED },
      }),

      // Assigned cases to this agent
      prisma.case.count({
        where: { assignedAgentId: userId },
      }),
    ]);

    return successResponse({
      totalCases,
      activeCases,
      completedCases,
      assignedCases,
    });
  } else if (role === 'ADMIN') {
    // Admin statistics - all cases in system
    const [
      totalCases,
      activeCases,
      completedCases,
      unassignedCases,
      pendingDocuments,
      totalDocuments,
    ] = await Promise.all([
      // Total cases
      prisma.case.count({}),

      // Active cases (not in terminal status)
      prisma.case.count({
        where: { status: { notIn: TERMINAL_STATUSES } },
      }),

      // Completed cases
      prisma.case.count({
        where: { status: CASE_STATUS_APPROVED },
      }),

      // Unassigned cases
      prisma.case.count({
        where: { assignedAgentId: null },
      }),

      // Pending documents (all documents awaiting review)
      prisma.document.count({
        where: { status: 'PENDING' },
      }),

      // Total documents in system
      prisma.document.count({}),
    ]);

    return successResponse({
      totalCases,
      activeCases,
      completedCases,
      unassignedCases,
      pendingDocuments,
      totalDocuments,
    });
  }

  throw new ApiError('Invalid user role', HttpStatus.BAD_REQUEST);
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
