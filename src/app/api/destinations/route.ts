// Destinations API Route - GET (list all active destinations) & POST (create new destination - ADMIN only)

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRoleGuard } from '@/lib/middleware/role-guard';

// Validation schema for creating/updating destinations
const destinationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z
    .string()
    .length(2, 'Code must be exactly 2 characters (ISO country code)')
    .toUpperCase()
    .or(z.string().length(3, 'Code must be 2-3 characters (ISO country code)').toUpperCase()),
  flagEmoji: z.string().min(1, 'Flag emoji is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
});

// Cache configuration - revalidate every 24 hours (destinations change rarely)
export const revalidate = 86400; // 24 hours in seconds
export const dynamic = 'force-static'; // Enable static generation with ISR

// GET /api/destinations - Get all active destinations (public endpoint with caching)
const getHandler = asyncHandler(async (request: NextRequest) => {
  // Only return active destinations (mobile app needs this)
  const destinations = await prisma.destination.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
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

  logger.info('Destinations fetched (cached)', {
    count: destinations.length,
  });

  return successResponse(destinations);
});

// POST /api/destinations - Create new destination (ADMIN only)
const postHandler = asyncHandler(async (request: NextRequest, userId: string) => {
  const body = await request.json();

  // Validate input
  const validationResult = destinationSchema.safeParse(body);
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((err) => err.message).join(', ');
    throw new ApiError(errors, HttpStatus.BAD_REQUEST);
  }

  const data = validationResult.data;

  // Check for duplicate code or name
  const existing = await prisma.destination.findFirst({
    where: {
      OR: [{ code: data.code }, { name: data.name }],
    },
  });

  if (existing) {
    throw new ApiError(
      `Destination with code "${data.code}" or name "${data.name}" already exists`,
      HttpStatus.CONFLICT
    );
  }

  const destination = await prisma.destination.create({
    data: {
      ...data,
      createdById: userId || undefined,
    },
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

  logger.info('Destination created - cache will be revalidated', {
    destinationId: destination.id,
    name: destination.name,
    code: destination.code,
    createdBy: userId,
  });

  // Revalidate the destinations list cache
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/api/destinations');
  } catch (error) {
    logger.warn('Failed to revalidate cache', error);
  }

  return successResponse(destination, 'Destination created successfully', HttpStatus.CREATED);
});

// Apply middleware - GET is public, POST requires ADMIN role
export const GET = withCorsMiddleware(getHandler);
export const POST = async (req: NextRequest, context?: unknown) => {
  return withCorsMiddleware(await withRoleGuard(postHandler, ['ADMIN']))(req, context);
};
