// POST /api/auth/google - Handle Google Sign-In
// Creates or updates user after Google authentication

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

const handler = asyncHandler(async (request: NextRequest) => {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
        throw new ApiError(
            'Authentication service unavailable',
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }

    const body = await request.json();
    const { firebaseUid, email, displayName, photoURL, isNewUser } = body;

    if (!firebaseUid || !email) {
        throw new ApiError('Invalid request data', HttpStatus.BAD_REQUEST);
    }

    // Verify the Firebase token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.uid !== firebaseUid) {
        throw new ApiError('Invalid authentication', HttpStatus.UNAUTHORIZED);
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
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
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
        },
    });

    if (user) {
        // Update last login
        user = await prisma.user.update({
            where: { id: firebaseUid },
            data: { lastLogin: new Date() },
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
                lastLogin: true,
            },
        });

        logger.info('User logged in with Google', { userId: user.id, email: user.email });

        return successResponse({ user }, 'Login successful');
    }

    // Create new user
    const names = displayName?.split(' ') || ['', ''];
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || '';

    user = await prisma.user.create({
        data: {
            id: firebaseUid,
            email,
            password: 'google_oauth', // Password managed by Google
            firstName,
            lastName,
            phone: null,
            role: 'CLIENT',
            isVerified: true, // Google accounts are already verified
            profilePicture: photoURL || null,
        },
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
            lastLogin: true,
        },
    });

    // Set custom claims
    await adminAuth.setCustomUserClaims(firebaseUid, {
        role: 'CLIENT',
        userId: user.id,
    });

    logger.info('User registered with Google', { userId: user.id, email: user.email });

    return successResponse({ user }, 'Registration successful', 201);
});

// Apply middleware
export const POST = withCorsMiddleware(
    withRateLimit(handler, RateLimitPresets.AUTH)
);

