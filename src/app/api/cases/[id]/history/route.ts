// Case History API Route - GET (retrieve status history for a case)
// Allows clients to view their own case history

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id]/history - Get status history for a case
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;

  // Check if case exists
  const caseData = await prisma.case.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      assignedAgentId: true,
    },
  });

  if (!caseData) {
    throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
  }

  // Check permissions - clients can only view their own case history
  if (req.user.role === 'CLIENT' && caseData.clientId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  // Fetch status history
  const history = await prisma.statusHistory.findMany({
    where: { caseId: id },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Enrich with user information
  const enrichedHistory = await Promise.all(
    history.map(async (entry) => {
      const user = await prisma.user.findUnique({
        where: { id: entry.changedBy },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      return {
        ...entry,
        changedByUser: user,
      };
    })
  );

  logger.info('Case history retrieved', {
    caseId: id,
    userId: req.user.userId,
    historyCount: enrichedHistory.length,
  });

  return successResponse(enrichedHistory, 'Case history retrieved successfully');
});

// Apply middleware
export const GET = withCorsMiddleware(authenticateToken(getHandler));
