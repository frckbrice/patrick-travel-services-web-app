// PATCH /api/cases/[id]/priority - Update case priority (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

const handler = asyncHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const req = request as AuthenticatedRequest;

  if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const params = await context.params;

  const body = await request.json();
  const { priority } = body;

  if (!priority || !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
    throw new ApiError('Valid priority is required', HttpStatus.BAD_REQUEST);
  }

  const caseData = await prisma.case.update({
    where: { id: params.id },
    data: { priority },
  });

  logger.info('Case priority updated', { caseId: params.id, priority, updatedBy: req.user.userId });

  return successResponse({ case: caseData }, 'Priority updated successfully');
});

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
