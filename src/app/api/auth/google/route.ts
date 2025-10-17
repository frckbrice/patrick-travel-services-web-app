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
import { randomBytes } from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const handler = asyncHandler(async (request: NextRequest) => {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
        throw new ApiError(
            'Authentication service unavailable',
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }

    // Verify the Firebase token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError('Unauthorized - Missing or invalid token', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
        decodedToken = await adminAuth.verifyIdToken(token);
        logger.info('Firebase token verified for Google sign-in', { uid: decodedToken.uid });
    } catch (error: any) {
        logger.error('Firebase token verification failed', { error: error.message });
        throw new ApiError('Invalid authentication token', HttpStatus.UNAUTHORIZED);
    }

    // Extract Firebase UID from verified token (this is secure)
    const firebaseUid = decodedToken.uid;

    const body = await request.json();
    const { email, displayName, photoURL } = body;

    if (!email) {
        throw new ApiError('Email is required', HttpStatus.BAD_REQUEST);
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

        logger.info('User logged in with Google', { userId: user.id });
        return successResponse({ user }, 'Login successful');
    }

    // Create new user
    const names = displayName?.split(' ') || ['', ''];
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || '';

    try {
        user = await prisma.user.create({
            data: {
                id: firebaseUid,
                email,
                password: randomBytes(32).toString('hex'), // Random value for OAuth users
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
    } catch (error) {
        // Handle race condition: concurrent requests trying to create the same user
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            logger.info('Concurrent user creation detected, fetching existing user', { firebaseUid });

            // User was created by another concurrent request, fetch and update it
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

            logger.info('User logged in with Google (after race condition)', { userId: user.id });
            return successResponse({ user }, 'Login successful');
        }

        // For any other error, log and rethrow
        logger.error('Error creating user with Google', { error, firebaseUid, email });
        throw error;
    }
});

// Apply middleware
export const POST = withCorsMiddleware(
    withRateLimit(handler, RateLimitPresets.AUTH)
);

