// Documents API Routes - GET, DELETE by ID
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

// GET /api/documents/[id] - Get document by ID
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid document ID', HttpStatus.BAD_REQUEST);
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      case: {
        select: {
          id: true,
          referenceNumber: true,
          serviceType: true,
          status: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!document) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Check permissions
  if (req.user.role === 'CLIENT' && document.uploadedById !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  logger.info('Document retrieved', { documentId: id, userId: req.user.userId });

  return successResponse({ document }, 'Document retrieved successfully');
});

// DELETE /api/documents/[id] - Delete document
const deleteHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid document ID', HttpStatus.BAD_REQUEST);
  }

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Check permissions - only document owner or ADMIN can delete
  if (req.user.role !== 'ADMIN' && document.uploadedById !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  await prisma.document.delete({
    where: { id },
  });

  // TODO: Delete file from UploadThing
  // This requires implementing UploadThing file deletion

  logger.info('Document deleted', { documentId: id, userId: req.user.userId });

  return successResponse(null, SUCCESS_MESSAGES.DELETED);
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(deleteHandler), RateLimitPresets.STANDARD)
);
