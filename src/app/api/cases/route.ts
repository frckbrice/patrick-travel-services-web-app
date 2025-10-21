// Cases API Routes - GET (list all) and POST (create new case)
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// GET /api/cases - List all cases (with filters)
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  // Validate and parse page
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  // Validate and clamp limit
  let limit = limitParam ? parseInt(limitParam, 10) : PAGINATION.DEFAULT_LIMIT;

  if (isNaN(limit) || limit <= 0) {
    throw new ApiError('Limit must be a positive integer', HttpStatus.BAD_REQUEST);
  }

  // Clamp limit to MAX_LIMIT to prevent excessive resource usage
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const skip = (page - 1) * limit;

  // Build filter based on user role
  const where: any = {};

  if (req.user.role === 'CLIENT') {
    // Clients can only see their own cases
    where.clientId = req.user.userId;
    logger.info('CLIENT case filter', {
      userId: req.user.userId,
      clientId: where.clientId,
    });
  } else if (req.user.role === 'AGENT' && userId) {
    // Agents can filter by userId
    where.clientId = userId;
  }

  if (status) {
    where.status = status;
  }

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
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
      orderBy: { submissionDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.case.count({ where }),
  ]);

  logger.info('Cases retrieved', {
    userId: req.user.userId,
    role: req.user.role,
    count: cases.length,
    total,
    filter: where,
    caseIds: cases.map((c) => c.id),
  });

  return successResponse(
    {
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    'Cases retrieved successfully'
  );
});

// POST /api/cases - Create new case
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const { serviceType, priority } = body;

  // Validation
  if (!serviceType) {
    throw new ApiError('serviceType is required', HttpStatus.BAD_REQUEST);
  }

  // Generate unique reference number
  const referenceNumber = `PT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  // Create case
  const newCase = await prisma.case.create({
    data: {
      referenceNumber,
      serviceType,
      priority: priority || 'NORMAL',
      status: 'SUBMITTED',
      clientId: req.user.userId,
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
    },
  });

  logger.info('Case created', {
    caseId: newCase.id,
    userId: req.user.userId,
  });

  return successResponse({ case: newCase }, SUCCESS_MESSAGES.CREATED, HttpStatus.CREATED);
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
