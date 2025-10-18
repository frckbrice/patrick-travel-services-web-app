// PATCH /api/cases/[id]/estimated-completion - Set estimated completion date (AGENT/ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

const handler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const req = request as AuthenticatedRequest;
    const params = await context.params;

    if (!req.user || !['AGENT', 'ADMIN'].includes(req.user.role)) {
      throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const body = await request.json();
    const { estimatedCompletion } = body;

    if (!estimatedCompletion) {
      throw new ApiError('Estimated completion date is required', HttpStatus.BAD_REQUEST);
    }

    const date = new Date(estimatedCompletion);
    if (isNaN(date.getTime())) {
      throw new ApiError('Invalid date format', HttpStatus.BAD_REQUEST);
    }

    // Check if case exists before updating
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
    });

    if (!existingCase) {
      throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    const caseData = await prisma.case.update({
      where: { id: params.id },
      data: { estimatedCompletion: date },
    });

    logger.info('Estimated completion set', {
      caseId: params.id,
      date: date.toISOString(),
      setBy: req.user.userId,
    });

    return successResponse({ case: caseData }, 'Estimated completion date set successfully');
  }
);

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
