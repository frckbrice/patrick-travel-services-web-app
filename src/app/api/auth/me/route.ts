// GET /api/auth/me - Get current authenticated user

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';

async function handler(request: AuthenticatedRequest) {
    try {
        const userId = request.user?.userId || request.user?.uid;

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: ERROR_MESSAGES.UNAUTHORIZED,
                },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            return NextResponse.json(
                {
                    success: false,
                    error: ERROR_MESSAGES.NOT_FOUND,
                },
                { status: 404 }
            );
        }

        logger.debug('User info retrieved', { userId: user.id });

        return NextResponse.json(
            {
                success: true,
                data: user,
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Get current user error', error);

        return NextResponse.json(
            {
                success: false,
                error: ERROR_MESSAGES.SERVER_ERROR,
            },
            { status: 500 }
        );
    }
}

export const GET = authenticateToken(handler);
