// POST /api/auth/login - User login with Firebase Auth
// Firebase handles authentication on client side
// This endpoint syncs user data after Firebase auth and updates last login
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/utils/api-response';
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

  // Verify Firebase ID token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized - Missing or invalid token', HttpStatus.UNAUTHORIZED);
  }

  const token = authHeader.split('Bearer ')[1];
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
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(ERROR_MESSAGES.ACCOUNT_INACTIVE, HttpStatus.FORBIDDEN);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
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
