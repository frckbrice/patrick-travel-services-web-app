import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/templates/[id] - Get template details and increment download count
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Template ID is required', HttpStatus.BAD_REQUEST);
  }
  const template = await prisma.documentTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new ApiError('Template not found', HttpStatus.NOT_FOUND);
  }

  if (!template.isActive) {
    throw new ApiError('Template is not available', HttpStatus.FORBIDDEN);
  }

  // Increment download count
  await prisma.documentTemplate.update({
    where: { id },
    data: {
      downloadCount: {
        increment: 1,
      },
    },
  });

  logger.info('Template downloaded', { templateId: id, name: template.name });

  return NextResponse.json({
    success: true,
    data: { template },
  });
});

// PATCH /api/templates/[id] - Update template (ADMIN only)
const patchHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;
  const { id } = await context.params;

  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError('Admin access required', HttpStatus.FORBIDDEN);
  }

  const body = await request.json();

  const template = await prisma.documentTemplate.update({
    where: { id },
    data: {
      ...body,
      updatedAt: new Date(),
    },
  });

  logger.info('Template updated', { templateId: id });

  return NextResponse.json({
    success: true,
    data: { template },
    message: 'Template updated successfully',
  });
});

// DELETE /api/templates/[id] - Delete template (ADMIN only)
const deleteHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;
  const { id } = await context.params;

  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError('Admin access required', HttpStatus.FORBIDDEN);
  }

  await prisma.documentTemplate.delete({
    where: { id },
  });

  logger.info('Template deleted', { templateId: id });

  return NextResponse.json({
    success: true,
    message: 'Template deleted successfully',
  });
});

export const GET = withCorsMiddleware(withRateLimit(getHandler, RateLimitPresets.STANDARD));

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(patchHandler), RateLimitPresets.STANDARD)
);

export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(deleteHandler), RateLimitPresets.STANDARD)
);
