// Destinations API Route - GET, PUT, DELETE (individual destination operations)

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// Validation schema for updating destinations
const updateDestinationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  code: z
    .string()
    .length(2, 'Code must be exactly 2 characters (ISO country code)')
    .toUpperCase()
    .or(z.string().length(3, 'Code must be 2-3 characters (ISO country code)').toUpperCase())
    .optional(),
  flagEmoji: z.string().min(1, 'Flag emoji is required').optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/destinations/[id] - Get single destination (public)
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;

  const destination = await prisma.destination.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      flagEmoji: true,
      description: true,
      isActive: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          cases: true,
        },
      },
    },
  });

  if (!destination) {
    throw new ApiError('Destination not found', HttpStatus.NOT_FOUND);
  }

  return successResponse(destination);
});

// PUT /api/destinations/[id] - Update destination (ADMIN only)
const putHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  if (req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { id } = await context.params;
  const body = await request.json();

  // Validate input
  const validationResult = updateDestinationSchema.safeParse(body);
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((err) => err.message).join(', ');
    throw new ApiError(errors, HttpStatus.BAD_REQUEST);
  }

  const data = validationResult.data;

  // Check if destination exists
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError('Destination not found', HttpStatus.NOT_FOUND);
  }

  // Check for duplicate code or name (if being updated)
  if (data.code || data.name) {
    const duplicate = await prisma.destination.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [data.code ? { code: data.code } : {}, data.name ? { name: data.name } : {}].filter(
              (obj) => Object.keys(obj).length > 0
            ),
          },
        ],
      },
    });

    if (duplicate) {
      throw new ApiError(
        'Another destination with this code or name already exists',
        HttpStatus.CONFLICT
      );
    }
  }

  const destination = await prisma.destination.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      code: true,
      flagEmoji: true,
      description: true,
      isActive: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('Destination updated - revalidating cache', {
    destinationId: destination.id,
    name: destination.name,
  });

  // Revalidate the destinations list cache
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/api/destinations');
  } catch (error) {
    logger.warn('Failed to revalidate cache', error);
  }

  return successResponse(destination, 'Destination updated successfully');
});

// DELETE /api/destinations/[id] - Delete destination (ADMIN only)
// Soft delete by setting isActive to false if there are associated cases
const deleteHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  if (req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { id } = await context.params;

  // Check if destination exists
  const destination = await prisma.destination.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          cases: true,
        },
      },
    },
  });

  if (!destination) {
    throw new ApiError('Destination not found', HttpStatus.NOT_FOUND);
  }

  // If there are associated cases, soft delete (set isActive to false)
  if (destination._count.cases > 0) {
    const updated = await prisma.destination.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('Destination soft deleted - revalidating cache', {
      destinationId: id,
      casesCount: destination._count.cases,
    });

    // Revalidate the destinations list cache
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/api/destinations');
    } catch (error) {
      logger.warn('Failed to revalidate cache', error);
    }

    return successResponse(
      { id: updated.id, isActive: updated.isActive },
      `Destination deactivated (${destination._count.cases} associated cases)`
    );
  }

  // Otherwise, hard delete
  await prisma.destination.delete({ where: { id } });

  logger.info('Destination deleted - revalidating cache', { destinationId: id });

  // Revalidate the destinations list cache
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/api/destinations');
  } catch (error) {
    logger.warn('Failed to revalidate cache', error);
  }

  return successResponse({ id }, 'Destination deleted successfully');
});

// Apply middleware
export const GET = withCorsMiddleware(getHandler);
export const PUT = withCorsMiddleware(authenticateToken(putHandler));
export const DELETE = withCorsMiddleware(authenticateToken(deleteHandler));
