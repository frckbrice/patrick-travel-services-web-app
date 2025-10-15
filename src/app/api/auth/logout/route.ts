// POST /api/auth/logout - Logout user

import { NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { adminAuth } from '@/lib/firebase/firebase-admin';

async function handler(request: AuthenticatedRequest) {
    try {
        const userId = request.user?.userId || request.user?.uid;

        if (userId) {
            logger.info('User logged out', { userId });

            // Optionally revoke refresh tokens for added security
            if (adminAuth) {
                try {
                    await adminAuth.revokeRefreshTokens(userId);
                } catch (error) {
                    // Log but don't fail the logout
                    logger.warn('Failed to revoke refresh tokens', {
                        userId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Logout error', error);

        return NextResponse.json(
            {
                success: false,
                error: ERROR_MESSAGES.SERVER_ERROR,
            },
            { status: 500 }
        );
    }
}

export const POST = authenticateToken(handler);
