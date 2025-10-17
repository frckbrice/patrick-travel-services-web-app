// GET /api/users/settings - Fetch user preferences
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

// GET handler to fetch user settings
const getHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user.userId;

    // Fetch all user settings
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: {
                startsWith: `user:${userId}:`
            }
        }
    });

    // Parse settings into an object
    const settingsData = {
        emailNotifications: true, // defaults
        pushNotifications: true,
        smsNotifications: false,
    };

    settings.forEach((setting) => {
        const key = setting.key.replace(`user:${userId}:`, '');
        if (key in settingsData) {
            settingsData[key as keyof typeof settingsData] = setting.value === 'true';
        }
    });

    logger.info('Settings fetched', { userId });

    return successResponse({ settings: settingsData }, 'Settings fetched successfully');
});

// PATCH handler to update user settings
const patchHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;
    
    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const body = await request.json();
    const validationResult = settingsSchema.safeParse(body);

    if (!validationResult.success) {
        throw new ApiError(
            'Invalid input: ' + validationResult.error.issues
                .map((e: any) => `${e.path.join('.')}: ${e.message}`)
                .join(', '),
            HttpStatus.BAD_REQUEST
        );
    }

    const settingsData = validationResult.data;
    const userId = req.user.userId; // Extract userId for use in transaction
    
    // Store in SystemSetting table with user-specific keys
    // Collect all upsert operations to run in a single transaction
    const upsertOperations = Object.entries(settingsData).map(([key, value]) =>
        prisma.systemSetting.upsert({
            where: { key: `user:${userId}:${key}` },
            update: { value: String(value), updatedBy: userId },
            create: { 
                key: `user:${userId}:${key}`, 
                value: String(value), 
                category: 'user_preferences', 
                updatedBy: userId 
            },
        })
    );

    // Execute all upserts in a single transaction for atomicity
    await prisma.$transaction(upsertOperations);

    logger.info('Settings updated', { userId: req.user.userId });

    return successResponse({ settings: settingsData }, 'Settings updated successfully');
});

export const GET = withCorsMiddleware(withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD));
export const PATCH = withCorsMiddleware(withRateLimit(authenticateToken(patchHandler), RateLimitPresets.STANDARD));
