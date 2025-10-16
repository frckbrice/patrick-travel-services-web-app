// PATCH /api/users/settings - Update user preferences

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

const settingsSchema = z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
});

const handler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;
    
    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const body = await request.json();
    const validationResult = settingsSchema.safeParse(body);

    if (!validationResult.success) {
        throw new ApiError('Invalid input', HttpStatus.BAD_REQUEST);
    }

    const settingsData = validationResult.data;
    
    // Store in SystemSetting table with user-specific keys
    for (const [key, value] of Object.entries(settingsData)) {
        await prisma.systemSetting.upsert({
            where: { key: `user:${req.user.userId}:${key}` },
            update: { value: String(value), updatedBy: req.user.userId },
            create: { 
                key: `user:${req.user.userId}:${key}`, 
                value: String(value), 
                category: 'user_preferences', 
                updatedBy: req.user.userId 
            },
        });
    }

    logger.info('Settings updated', { userId: req.user.userId });

    return successResponse({ settings: settingsData }, 'Settings updated successfully');
});

export const PATCH = withCorsMiddleware(withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD));

