// Users API Routes - GET (list all users - ADMIN/AGENT only)
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, PAGINATION } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { Prisma } from '@prisma/client';

// GET /api/users - List all users (ADMIN/AGENT only)
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // Only ADMIN and AGENT can list users
  if (!['ADMIN', 'AGENT'].includes(req.user.role)) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const includeCaseCounts = searchParams.get('includeCaseCounts') === 'true';

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

  // Build where clause with proper Prisma typing
  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role as Prisma.EnumRoleFilter['equals'];
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // IMPORTANT FILTERING: Only show clients who have cases
  // - For AGENTS: Only clients with cases assigned to them
  // - For ADMINS: Only clients with at least one case (any status)
  // This prevents agents from seeing clients without cases (which would cause 403 errors)
  // and helps focus on important, active clients
  if (role === 'CLIENT') {
    if (req.user.role === 'AGENT') {
      // Agents only see clients with cases assigned to them
      where.cases = {
        some: {
          assignedAgentId: req.user.userId,
        },
      };
    } else if (req.user.role === 'ADMIN') {
      // Admins only see clients who have at least one case
      where.cases = {
        some: {},
      };
    }
  }

  // PERFORMANCE OPTIMIZATION: Fetch users with optional case counts
  let users;
  let usersWithCaseCounts;

  if (includeCaseCounts) {
    // When case counts are requested, use include for type safety
    const usersWithRelations = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cases: true, // Total cases count
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get active cases count for each user efficiently in a single query
    const userIds = usersWithRelations.map((u) => u.id);
    const activeCasesCounts = await prisma.case.groupBy({
      by: ['clientId'],
      where: {
        clientId: { in: userIds },
        status: {
          notIn: ['APPROVED', 'REJECTED', 'CLOSED'],
        },
      },
      _count: {
        id: true,
      },
    });

    // Map active cases to users
    const activeCasesMap = new Map(
      activeCasesCounts.map((item) => [item.clientId, item._count.id])
    );

    // Transform response to include case counts
    usersWithCaseCounts = usersWithRelations.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      casesCount: user._count.cases,
      activeCases: activeCasesMap.get(user.id) || 0,
    }));
  } else {
    // Standard query without case counts
    users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    usersWithCaseCounts = users;
  }

  const total = await prisma.user.count({ where });

  logger.info('Users retrieved', {
    userId: req.user.userId,
    role: req.user.role,
    count: usersWithCaseCounts.length,
    includeCaseCounts,
  });

  return successResponse(
    {
      users: usersWithCaseCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    'Users retrieved successfully'
  );
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
