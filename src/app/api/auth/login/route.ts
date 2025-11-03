// POST /api/auth/login - User login with Firebase Auth
// Firebase handles authentication on client side
// This endpoint syncs user data after Firebase auth and updates last login
// Compatible with both web and mobile clients

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { createSafeLogIdentifier } from '@/lib/utils/pii-hash';
import { setCustomClaimsWithRetry } from '@/lib/utils/firebase-claims';

const handler = asyncHandler(async (request: NextRequest) => {
  // Check if Firebase Admin is initialized
  if (!adminAuth) {
    logger.error('Firebase Admin not initialized');
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  // Verify Firebase ID token from Authorization header OR request body
  // This supports both web (header) and mobile (body) clients
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;
  let requestBody: any = null;

  // Try to get token from Authorization header first (preferred)
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1];
    logger.debug('Login using token from Authorization header');
  } else {
    // Fallback: Check request body for { idToken: "..." } (mobile compatibility)
    try {
      requestBody = await request.json();
      if (
        requestBody &&
        typeof requestBody.idToken === 'string' &&
        requestBody.idToken.trim().length > 0
      ) {
        token = requestBody.idToken.trim();
        logger.info('Login using idToken from request body (mobile client)');
      }
    } catch (error) {
      // JSON parsing failed - might be empty body, which is OK if token is in header
      // Will be handled by token check below
    }
  }

  if (!token) {
    throw new ApiError(
      'Unauthorized - Missing Firebase ID token. Send either Authorization header or { idToken: "..." } in body',
      HttpStatus.UNAUTHORIZED
    );
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
    // Log with hashed UID to prevent PII leakage
    logger.info(
      'Firebase token verified for login',
      createSafeLogIdentifier(decodedToken.uid, null)
    );
  } catch (error: any) {
    logger.error('Firebase token verification failed', { error: error.message });
    throw new ApiError('Invalid authentication token', HttpStatus.UNAUTHORIZED);
  }

  // Extract Firebase UID from verified token (this is secure)
  const firebaseUid = decodedToken.uid;

  // Get user email from Firebase token
  const firebaseEmail = decodedToken.email;

  // Try to find user by Firebase UID first
  let user = await prisma.user.findUnique({
    where: { firebaseId: firebaseUid },
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
      firebaseId: true, // Include to check if it exists
    },
  });

  // If user not found by firebaseId, try to find by email and update firebaseId
  if (!user && firebaseEmail) {
    logger.info('User not found by firebaseId, attempting to find by email', {
      firebaseEmail: firebaseEmail.substring(0, 5) + '...',
    });

    user = await prisma.user.findUnique({
      where: { email: firebaseEmail },
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
        firebaseId: true,
      },
    });

    // If found by email, update firebaseId
    if (user && !user.firebaseId) {
      logger.info('Updating user with firebaseId', {
        userId: user.id,
        email: user.email,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { firebaseId: firebaseUid },
      });

      logger.info('firebaseId successfully linked to user', {
        userId: user.id,
      });
    }
  }

  if (!user) {
    // Auto-provision minimal user if verified token and email exist
    if (firebaseEmail) {
      logger.info('Auto-provisioning user from Firebase token', {
        hint: firebaseEmail.substring(0, 5) + '...',
      });

      const created = await prisma.user.create({
        data: {
          email: firebaseEmail,
          password: '',
          firstName: 'User',
          lastName: '',
          role: 'CLIENT',
          isActive: true,
          isVerified: true,
          firebaseId: firebaseUid,
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
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          firebaseId: true,
        },
      });

      user = created;
    } else {
      // Log with hashed UID for debugging without exposing PII
      logger.warn(
        'Login attempt for non-existent user and no email on token',
        createSafeLogIdentifier(firebaseUid, null)
      );
      throw new ApiError(
        'User account not found. Please contact support if you believe this is an error.',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(ERROR_MESSAGES.ACCOUNT_INACTIVE, HttpStatus.FORBIDDEN);
  }

  // Update last login
  await prisma.user.update({
    where: { firebaseId: firebaseUid },
    data: { lastLogin: new Date() },
  });

  // CRITICAL FIX FOR 403 ERRORS: Refresh custom claims on every login
  // This ensures the Firebase ID token always has the correct role and userId
  // Without this, users may get 403 Forbidden errors when accessing role-protected routes
  try {
    await setCustomClaimsWithRetry(
      firebaseUid,
      {
        role: user.role,
        userId: user.id,
      },
      {
        maxRetries: 2, // Fewer retries for login (not as critical as registration)
        rollbackOnFailure: false, // Don't delete user on login claim failure
      }
    );
    logger.info('Custom claims refreshed on login', { userId: user.id, role: user.role });
  } catch (claimsError) {
    // Log but don't fail login - user can still proceed with existing claims
    logger.warn('Failed to refresh custom claims on login', {
      userId: user.id,
      error: claimsError instanceof Error ? claimsError.message : String(claimsError),
    });
    // Continue with login - this isn't critical enough to block the user
  }

  // Log with hashed identifiers to prevent PII leakage
  logger.info('User logged in successfully', createSafeLogIdentifier(user.id, user.email));

  return successResponse(
    {
      user: {
        ...user,
        lastLogin: new Date(),
      },
    },
    SUCCESS_MESSAGES.LOGIN_SUCCESS
  );
});

// Apply middleware: CORS -> Rate Limit -> Handler
export const POST = withCorsMiddleware(withRateLimit(handler, RateLimitPresets.AUTH));

// Return 405 Method Not Allowed for unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}
