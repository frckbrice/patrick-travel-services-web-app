// POST /api/admin/invite-codes/validate - Validate invite code
// Public endpoint (no auth required) - used during registration

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';

const handler = asyncHandler(async (request: NextRequest) => {
    const { code } = await request.json();

    if (!code) {
        throw new ApiError('Invite code is required', HttpStatus.BAD_REQUEST);
    }

    // Find invite code
    const inviteCode = await prisma.inviteCode.findUnique({
        where: { code },
        select: {
            id: true,
            code: true,
            role: true,
            maxUses: true,
            usedCount: true,
            expiresAt: true,
            isActive: true,
        },
    });

    if (!inviteCode) {
        throw new ApiError('Invalid invite code', HttpStatus.NOT_FOUND);
    }

    // Check if code is valid
    if (!inviteCode.isActive) {
        throw new ApiError('This invite code has been deactivated', HttpStatus.FORBIDDEN);
    }

    if (new Date() > inviteCode.expiresAt) {
        throw new ApiError('This invite code has expired', HttpStatus.FORBIDDEN);
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
        throw new ApiError('This invite code has reached its usage limit', HttpStatus.FORBIDDEN);
    }

    return successResponse(
        {
            role: inviteCode.role,
            valid: true
        },
        'Invite code is valid'
    );
});

export const POST = withCorsMiddleware(handler);
