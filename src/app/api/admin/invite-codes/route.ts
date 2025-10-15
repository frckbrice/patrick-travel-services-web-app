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

    const { role, expiresInDays, maxUses } = validationResult.data;

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
            createdBy: adminId,
            maxUses,
            expiresAt,
    logger.info('Invite code created', {
        codePrefix: inviteCode.code.substring(0, 10) + '...',
        role: inviteCode.role,
        createdBy: adminId
    });
        role: inviteCode.role,
        createdBy: adminId
    });

    return successResponse(
        { inviteCode },
        `Invite code created for ${role} role`,
        201
    );
});

// GET - List all invite codes
const getHandler = asyncHandler(async (request: NextRequest) => {
    await verifyAdminAccess(request);

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');

    const inviteCodes = await prisma.inviteCode.findMany({
        where: isActive === 'true' ? {
            isActive: true,
            expiresAt: { gt: new Date() },
        } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            code: true,
            role: true,
            createdBy: true,
            usedBy: true,
            maxUses: true,
            usedCount: true,
            expiresAt: true,
            isActive: true,
            createdAt: true,
            usedAt: true,
        },
    });

    return successResponse({ inviteCodes }, 'Invite codes retrieved');
});

// Apply middleware
export const POST = withCorsMiddleware(
    withRateLimit(postHandler, RateLimitPresets.STANDARD)
);

export const GET = withCorsMiddleware(
    withRateLimit(getHandler, RateLimitPresets.STANDARD)
);

