// GET /api/admin/activity-logs/export - Export activity logs as CSV (Admin only)
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { NextResponse } from 'next/server';

// Helper function to escape CSV fields
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, ' ')}"`;
  }
  return str;
}

// GET /api/admin/activity-logs/export
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  // Only ADMIN can export activity logs
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const searchParams = request.nextUrl.searchParams;

  // Filters (same as main endpoint but no pagination)
  const action = searchParams.get('action') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const search = searchParams.get('search') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  // Build where clause
  const where: any = {};

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

  // Fetch all logs matching criteria (limit to 10000 for safety)
  const logs = await prisma.activityLog.findMany({
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
    take: 10000,
  });

  // Build CSV
  const headers = [
    'ID',
    'Timestamp',
    'User ID',
    'User Name',
    'User Email',
    'User Role',
    'Action',
    'Description',
    'IP Address',
    'User Agent',
  ];

  const csvRows = [headers.join(',')];

  for (const log of logs) {
    const row = [
      escapeCsvField(log.id),
      escapeCsvField(log.timestamp.toISOString()),
      escapeCsvField(log.userId),
      escapeCsvField(`${log.user.firstName} ${log.user.lastName}`),
      escapeCsvField(log.user.email),
      escapeCsvField(log.user.role),
      escapeCsvField(log.action),
      escapeCsvField(log.description),
      escapeCsvField(log.ipAddress),
      escapeCsvField(log.userAgent),
    ];
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');

  logger.info('Activity logs exported', {
    requestedBy: req.user.userId,
    count: logs.length,
  });

  // Return CSV file
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString()}.csv"`,
    },
  });
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
