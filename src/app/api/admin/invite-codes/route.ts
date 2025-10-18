// POST /api/admin/invite-codes - Generate invite code (ADMIN only)
// GET /api/admin/invite-codes - List all invite codes (ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Validation schema
const createInviteCodeSchema = z.object({
  role: z.enum(['AGENT', 'ADMIN']),
  expiresInDays: z.number().min(1).max(365).default(7),
  maxUses: z.number().min(1).max(100).default(1),
  purpose: z.string().optional(), // Optional purpose for tracking (e.g., 'ADMIN_CREATED', 'SEED')
});

// Helper to verify admin role
async function verifyAdminAccess(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  if (!adminAuth) {
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    throw new ApiError('Invalid token', HttpStatus.UNAUTHORIZED);
  }
  const decodedToken = await adminAuth.verifyIdToken(token);

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: decodedToken.uid },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new ApiError('Forbidden: Admin access required', HttpStatus.FORBIDDEN);
  }

  return user.id;
}

// POST - Generate new invite code
const postHandler = asyncHandler(async (request: NextRequest) => {
  const adminId = await verifyAdminAccess(request);
  const body = await request.json();

  const validationResult = createInviteCodeSchema.safeParse(body);
  if (!validationResult.success) {
    throw new ApiError('Invalid input', HttpStatus.BAD_REQUEST);
  }

  const { role, expiresInDays, maxUses, purpose } = validationResult.data;

  // Generate secure random code
  const code = `${role.toLowerCase()}-${nanoid(16)}`;

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create invite code
  const inviteCode = await prisma.inviteCode.create({
    data: {
      code,
      role,
      createdById: adminId,
      maxUses,
      expiresAt,
      purpose: purpose || 'ADMIN_CREATED', // Default to ADMIN_CREATED if not specified
    },
  });

  logger.info('Invite code created', {
    code: inviteCode.code,
    role: inviteCode.role,
    createdBy: adminId,
  });

  return successResponse({ inviteCode }, `Invite code created for ${role} role`, 201);
});

// GET - List all invite codes with server-side filtering
const getHandler = asyncHandler(async (request: NextRequest) => {
  await verifyAdminAccess(request);

  const { searchParams } = new URL(request.url);

  // Parse and validate pagination params with safe defaults
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam || '10', 10) || 10));
  const skip = (page - 1) * limit;

  // Parse filter params
  const roleFilter = searchParams.get('role'); // 'AGENT' | 'ADMIN'
  const statusFilter = searchParams.get('status'); // 'active' | 'expired' | 'exhausted'
  const searchQuery = searchParams.get('search'); // Search in code or purpose
  const sortBy = searchParams.get('sortBy') || 'createdAt'; // Column to sort by
  const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' | 'desc'

  // Build where clause with filters
  const whereClause: any = {};

  // Role filter
  if (roleFilter && (roleFilter === 'AGENT' || roleFilter === 'ADMIN')) {
    whereClause.role = roleFilter;
  }

  // Status filter - we'll handle 'exhausted' post-query since Prisma doesn't support column comparisons
  const needsPostFilterExhausted = statusFilter === 'exhausted';

  if (statusFilter && statusFilter !== 'exhausted') {
    const now = new Date();
    if (statusFilter === 'active') {
      // Active: not expired, isActive = true (exhausted will be filtered client-side)
      whereClause.isActive = true;
      whereClause.expiresAt = { gt: now };
    } else if (statusFilter === 'expired') {
      // Expired: past expiration date OR isActive = false
      whereClause.OR = [
        { expiresAt: { lte: now } },
        { isActive: false }
      ];
    }
  }

  // Search filter (code or purpose)
  if (searchQuery) {
    whereClause.OR = [
      { code: { contains: searchQuery, mode: 'insensitive' } },
      { purpose: { contains: searchQuery, mode: 'insensitive' } }
    ];
  }

  // Build orderBy clause
  const orderBy: any = {};
  const validSortColumns = ['createdAt', 'role', 'usedCount', 'expiresAt', 'lastUsedAt'];
  if (validSortColumns.includes(sortBy)) {
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.createdAt = 'desc'; // Default
  }

  // Execute queries in parallel
  let [inviteCodes, total] = await Promise.all([
    prisma.inviteCode.findMany({
      where: whereClause,
      skip: needsPostFilterExhausted ? 0 : skip, // Fetch all if we need to filter
      take: needsPostFilterExhausted ? undefined : limit, // Fetch all if we need to filter
      orderBy,
      select: {
        id: true,
        code: true,
        role: true,
        createdById: true,
        lastUsedById: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        purpose: true,
        createdAt: true,
        lastUsedAt: true,
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lastUsedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.inviteCode.count({
      where: whereClause,
    }),
  ]);

  // Post-filter for exhausted status (usedCount >= maxUses)
  if (needsPostFilterExhausted) {
    inviteCodes = inviteCodes.filter(code => code.usedCount >= code.maxUses);
    total = inviteCodes.length;
    // Apply pagination after filtering
    const start = skip;
    const end = skip + limit;
    inviteCodes = inviteCodes.slice(start, end);
  }

  // Post-filter for active status to exclude exhausted codes
  // This is needed because we can't do column comparison in Prisma WHERE clause
  if (statusFilter === 'active') {
    const beforeFilterCount = inviteCodes.length;
    inviteCodes = inviteCodes.filter(code => code.usedCount < code.maxUses);
    const filtered = beforeFilterCount - inviteCodes.length;
    total = Math.max(0, total - filtered);
  }

  return successResponse(
    {
      inviteCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        role: roleFilter,
        status: statusFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
      },
    },
    'Invite codes retrieved'
  );
});

// Apply middleware
export const POST = withCorsMiddleware(withRateLimit(postHandler, RateLimitPresets.STANDARD));

export const GET = withCorsMiddleware(withRateLimit(getHandler, RateLimitPresets.STANDARD));
