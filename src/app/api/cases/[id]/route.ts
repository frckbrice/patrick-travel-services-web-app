// Cases API Routes - GET, PUT, DELETE by ID
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id] - Get case by ID
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Invalid case ID', HttpStatus.BAD_REQUEST);
  }

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
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
        },
      },
      documents: {
        select: {
          id: true,
          fileName: true,
          filePath: true,
          mimeType: true,
          fileSize: true,
          documentType: true,
          status: true,
          uploadDate: true,
        },
      },
    },
  });

  if (!caseData) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Check permissions
  if (req.user.role === 'CLIENT' && caseData.clientId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  logger.info('Case retrieved', { caseId: id, userId: req.user.userId });

  return successResponse({ case: caseData }, 'Case retrieved successfully');
});

// PUT /api/cases/[id] - Update case
const putHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  const body = await request.json();

  // Check if case exists
  const existingCase = await prisma.case.findUnique({
    where: { id },
  });

  if (!existingCase) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Check permissions
  if (req.user.role === 'CLIENT' && existingCase.clientId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  // Update case
  const updatedCase = await prisma.case.update({
    where: { id },
    data: {
      ...(body.serviceType && { serviceType: body.serviceType }),
      ...(body.status && { status: body.status }),
      ...(body.priority && { priority: body.priority }),
      ...(body.internalNotes && { internalNotes: body.internalNotes }),
    },
    include: {
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
        },
      },
    },
  });

  logger.info('Case updated', { caseId: id, userId: req.user.userId });

  return successResponse({ case: updatedCase }, SUCCESS_MESSAGES.CASE_UPDATED);
});

// DELETE /api/cases/[id] - Delete case
const deleteHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // Only ADMIN can delete cases
  if (req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { id } = await context.params;

  const existingCase = await prisma.case.findUnique({
    where: { id },
  });

  if (!existingCase) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await prisma.case.delete({
    where: { id },
  });

  logger.info('Case deleted', { caseId: id, userId: req.user.userId });

  return successResponse(null, SUCCESS_MESSAGES.CASE_DELETED);
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);

export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(deleteHandler), RateLimitPresets.STANDARD)
);
