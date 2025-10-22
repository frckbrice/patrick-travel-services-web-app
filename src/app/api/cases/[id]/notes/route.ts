// PATCH /api/cases/[id]/notes - Add internal note (AGENT/ADMIN only)

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
    const { note } = body;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      throw new ApiError('Note is required', HttpStatus.BAD_REQUEST);
    }

    if (note.length > 10000) {
      throw new ApiError('Note exceeds maximum length of 10000 characters', HttpStatus.BAD_REQUEST);
    }

    const existingCase = await prisma.case.findUnique({ where: { id: params.id } });

    if (!existingCase) {
      throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    const updatedNote = existingCase.internalNotes
      ? `${existingCase.internalNotes}\n\n[${new Date().toISOString()}] ${req.user.userId}:\n${note}`
      : `[${new Date().toISOString()}] ${req.user.userId}:\n${note}`;

    const caseData = await prisma.case.update({
      where: { id: params.id },
      data: { internalNotes: updatedNote },
    });

    logger.info('Internal note added', { caseId: params.id, addedBy: req.user.userId });

    return successResponse({ case: caseData }, 'Note saved successfully');
  }
);

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
