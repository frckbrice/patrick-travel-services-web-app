// POST /api/auth/register - Register new user with Firebase Auth
// This endpoint creates a user in both Firebase Auth and the database
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { registerSchema } from '@/features/auth/schemas/auth.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import type { ZodIssue } from 'zod';
import {
    successResponse,
    errorResponse,
    validationErrorResponse,
    serverErrorResponse,
} from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

const handler = asyncHandler(async (request: NextRequest) => {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
        const errors = validationResult.error.issues.reduce(
            (acc: Record<string, string[]>, err: ZodIssue) => {
                const path = err.path.join('.');
                if (!acc[path]) acc[path] = [];
                acc[path].push(err.message);
                return acc;
            },
            {} as Record<string, string[]>
        );

        return validationErrorResponse(errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const { email, firstName, lastName, phone, inviteCode, firebaseUid } = validationResult.data;

    if (!firebaseUid) {
        throw new ApiError('Firebase UID is required', HttpStatus.BAD_REQUEST);
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
        where: { id: firebaseUid },
    });

    if (existingUser) {
        return errorResponse(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, 409);
    }

    // Determine role based on invite code
    let userRole: 'CLIENT' | 'AGENT' | 'ADMIN' = 'CLIENT';

    if (inviteCode) {
        // Validate and use invite code
        const invite = await prisma.inviteCode.findUnique({
            where: { code: inviteCode },
        });

        if (!invite) {
            throw new ApiError('Invalid invite code', HttpStatus.BAD_REQUEST);
        }

        if (!invite.isActive) {
            throw new ApiError('This invite code has been deactivated', HttpStatus.FORBIDDEN);
        }

        if (new Date() > invite.expiresAt) {
            throw new ApiError('This invite code has expired', HttpStatus.FORBIDDEN);
        }

        if (invite.usedCount >= invite.maxUses) {
            throw new ApiError('This invite code has reached its usage limit', HttpStatus.FORBIDDEN);
        }

        // Use the role from invite code
        userRole = invite.role;

        // Update invite code usage
        await prisma.inviteCode.update({
            where: { id: invite.id },
            data: {
                usedCount: { increment: 1 },
                usedBy: firebaseUid,
                usedAt: new Date(),
            },
        });

        logger.info('Invite code used', { code: inviteCode, role: userRole, userId: firebaseUid });
    }

    // Create user in database (Firebase user already created on client)
    const user = await prisma.user.create({
        data: {
            id: firebaseUid, // Use Firebase UID as database ID
            email,
            password: 'firebase_managed', // Password managed by Firebase
            firstName,
            lastName,
            phone,
            role: userRole,
            isVerified: false,
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

    // Set custom claims in Firebase (if admin is available)
    if (adminAuth) {
        try {
            await adminAuth.setCustomUserClaims(firebaseUid, {
                role: userRole,
                userId: user.id,
            });
        } catch (error) {
            logger.warn('Failed to set custom claims, but registration succeeded', error);
        }
    }

    logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: userRole
    });

    return successResponse(
        { user },
        SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
        201
    );
});

// Apply middleware: CORS -> Rate Limit -> Handler
export const POST = withCorsMiddleware(
    withRateLimit(handler, RateLimitPresets.AUTH)
);
