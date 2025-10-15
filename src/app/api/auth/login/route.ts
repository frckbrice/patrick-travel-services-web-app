// POST /api/auth/login - User login with Firebase Auth
// Firebase handles authentication on client side
// This endpoint syncs user data after Firebase auth and updates last login
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
} from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { firebaseUid } = body;

        if (!firebaseUid) {
            return errorResponse('Firebase UID is required', 400);
        }

        // Find user by Firebase UID
        const user = await prisma.user.findUnique({
            where: { id: firebaseUid },
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
        });

        if (!user) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND, 404);
        }

        // Check if account is active
        if (!user.isActive) {
            return errorResponse(ERROR_MESSAGES.ACCOUNT_INACTIVE, 403);
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        logger.info('User logged in successfully', { userId: user.id, email: user.email });

        return successResponse(
            {
                user: {
                    ...user,
                    lastLogin: new Date(),
                },
            },
            SUCCESS_MESSAGES.LOGIN_SUCCESS
        );
    } catch (error) {
        logger.error('Login error', error);
        return serverErrorResponse(ERROR_MESSAGES.SERVER_ERROR);
    }
}
