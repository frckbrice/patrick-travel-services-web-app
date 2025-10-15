// POST /api/auth/register - Register new user with Firebase Auth
// This endpoint creates a user in both Firebase Auth and the database
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { registerSchema } from '@/features/auth/schemas/auth.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import {
    successResponse,
    errorResponse,
    validationErrorResponse,
    serverErrorResponse,
} from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
    try {
        // Check if Firebase Admin is initialized
        if (!adminAuth) {
            return serverErrorResponse('Authentication service unavailable');
        }

        const body = await request.json();

        // Validate input
        const validationResult = registerSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.errors.reduce((acc, err) => {
                const path = err.path.join('.');
                if (!acc[path]) acc[path] = [];
                acc[path].push(err.message);
                return acc;
            }, {} as Record<string, string[]>);

            return validationErrorResponse(errors, ERROR_MESSAGES.VALIDATION_ERROR);
        }

        const { email, password, firstName, lastName, phone } = validationResult.data;

        // Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, 409);
        }

        // Create user in Firebase Auth
        const firebaseUser = await adminAuth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false,
        });

        // Set custom claims for the user
        await adminAuth.setCustomUserClaims(firebaseUser.uid, {
            role: 'CLIENT',
        });

        // Create user in database
        const user = await prisma.user.create({
            data: {
                id: firebaseUser.uid, // Use Firebase UID as database ID
                email,
                password: 'firebase_managed', // Password managed by Firebase
                firstName,
                lastName,
                phone,
                role: 'CLIENT',
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

        // Generate custom token for immediate login
        const customToken = await adminAuth.createCustomToken(firebaseUser.uid, {
            role: 'CLIENT',
            userId: user.id,
        });

        logger.info('User registered successfully', { userId: user.id, email: user.email });

        // TODO: Send verification email via Firebase
        // await adminAuth.generateEmailVerificationLink(email);

        return successResponse(
            {
                user,
                customToken, // Client will exchange this for ID token
            },
            SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
            201
        );
    } catch (error) {
        // Check if error is from Firebase
        if ((error as { code?: string }).code === 'auth/email-already-exists') {
            return errorResponse(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, 409);
        }

        logger.error('Registration error', error);
        return serverErrorResponse(ERROR_MESSAGES.SERVER_ERROR);
    }
}
