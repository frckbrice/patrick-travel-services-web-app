// GET /api/admin/activity-logs - Get activity logs (Admin only)
// Supports filtering by action, userId, date range and pagination
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// GET /api/admin/activity-logs
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  // Only ADMIN can access activity logs
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const searchParams = request.nextUrl.searchParams;

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
  const skip = (page - 1) * limit;

  // Filters
  const action = searchParams.get('action') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const search = searchParams.get('search') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  // Build where clause
  const where: Record<string, any> = {};

  if (action) {
    where.action = { contains: action, mode: 'insensitive' };
  }

  if (userId) {
    where.userId = userId;
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = new Date(startDate);
    }
    if (endDate) {
      where.timestamp.lte = new Date(endDate);
    }
  }

  // Execute queries in parallel
  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  // Transform logs for response
  const transformedLogs = logs.map((log: typeof logs[number]) => ({
    id: log.id,
    userId: log.userId,
    userName: `${log.user.firstName} ${log.user.lastName}`,
    userEmail: log.user.email,
    userRole: log.user.role,
    action: log.action,
    description: log.description,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    metadata: log.metadata,
    timestamp: log.timestamp.toISOString(),
  }));

  const totalPages = Math.ceil(totalCount / limit);

  logger.info('Activity logs retrieved', {
    requestedBy: req.user.userId,
    count: logs.length,
    page,
    totalCount,
  });

  return successResponse(
    {
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    'Activity logs retrieved successfully'
  );
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
