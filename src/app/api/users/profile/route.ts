// PATCH /api/users/profile - Update user profile

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const updateProfileSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().or(z.literal('')),
});

const handler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
        throw new ApiError('Invalid input', HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: validationResult.data,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    logger.info('Profile updated', { userId: req.user.userId });

    return successResponse({ user: updatedUser }, 'Profile updated successfully');
});

export const PATCH = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));

