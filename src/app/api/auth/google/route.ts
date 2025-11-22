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
import { setCustomClaimsWithRetry, rollbackUserCreation } from '@/lib/utils/firebase-claims';
import { createSafeLogIdentifier, hashPII } from '@/lib/utils/pii-hash';
import { normalizeEmail } from '@/lib/utils/email';

const handler = asyncHandler(async (request: NextRequest) => {
  // Check if Firebase Admin is initialized
  if (!adminAuth) {
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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
    // Log with hashed UID to prevent PII leakage
    logger.info(
      'Firebase token verified for Google sign-in',
      createSafeLogIdentifier(decodedToken.uid, null)
    );
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

  const normalizedEmail = normalizeEmail(email);

  // Check if user exists in database by firebaseId
  let user = await prisma.user.findUnique({
    where: { firebaseId: firebaseUid },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      street: true,
      city: true,
      country: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
      firebaseId: true, // Include to check if it exists
    },
  });

  // If not found by firebaseId, try by email and update firebaseId
  if (!user) {
    logger.info('User not found by firebaseId in Google OAuth, attempting to find by email', {
      firebaseEmail: email.substring(0, 5) + '...',
    });

    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        city: true,
        country: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        firebaseId: true,
      },
    });

    // If found by email, update firebaseId
    if (user) {
      logger.info('Updating user with firebaseId from Google OAuth', {
        userId: user.id,
        email: user.email,
      });

      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseId: firebaseUid },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          city: true,
          country: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          firebaseId: true,
        },
      });

      logger.info('firebaseId successfully linked to user in Google OAuth', {
        userId: user.id,
      });
    }
  }

  if (user) {
    // Update last login
    user = await prisma.user.update({
      where: { firebaseId: firebaseUid },
      data: { lastLogin: new Date() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        city: true,
        country: true,
        role: true,
        isActive: true,
        isVerified: true,
        firebaseId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    // CRITICAL FIX FOR 403 ERRORS: Refresh custom claims on every Google login
    // This ensures the Firebase ID token always has the correct role and userId
    try {
      await setCustomClaimsWithRetry(
        firebaseUid,
        {
          role: user.role,
          userId: user.id,
        },
        {
          maxRetries: 2,
          rollbackOnFailure: false, // Don't delete user on login claim failure
        }
      );
      logger.info('Custom claims refreshed on Google login', { userId: user.id, role: user.role });
    } catch (claimsError) {
      // Log but don't fail login - user can still proceed with existing claims
      logger.warn('Failed to refresh custom claims on Google login', {
        userId: user.id,
        error: claimsError instanceof Error ? claimsError.message : String(claimsError),
      });
      // Continue with login - this isn't critical enough to block the user
    }

    logger.info('User logged in with Google', { userId: user.id });
    return successResponse({ user }, 'Login successful');
  }

  // Create new user
  const names = displayName?.split(' ') || ['', ''];
  const firstName = names[0] || 'User';
  const lastName = names.slice(1).join(' ') || '';

  try {
    const now = new Date();
    user = await prisma.user.create({
      data: {
        id: firebaseUid,
        email: normalizedEmail,
        password: randomBytes(32).toString('hex'), // Random value for OAuth users
        firstName,
        lastName,
        phone: null,
        role: 'CLIENT',
        isVerified: true, // Google accounts are already verified
        profilePicture: photoURL || null,
        firebaseId: firebaseUid, // Link Firebase UID
        // GDPR Consent Fields - Auto-provisioned on authentication (implicit consent)
        consentedAt: now,
        acceptedTerms: true,
        acceptedPrivacy: true,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        city: true,
        country: true,
        role: true,
        isActive: true,
        isVerified: true,
        firebaseId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    // Set custom claims with retry and automatic rollback on failure
    // This ensures data integrity between Firebase Auth and Prisma DB
    try {
      await setCustomClaimsWithRetry(firebaseUid, {
        role: 'CLIENT',
        userId: user.id,
      });
    } catch (claimError) {
      // Claims setting failed - setCustomClaimsWithRetry already deleted DB user
      // We must also delete the Google-created Firebase user to prevent orphans
      // Log with hashed identifiers to prevent PII leakage
      logger.error('Claims setting failed for Google OAuth user, rolling back Firebase account', {
        firebaseUidHash: hashPII(firebaseUid),
        emailHash: hashPII(email),
      });

      try {
        await rollbackUserCreation(firebaseUid, {
          deleteFirebase: true,
          deletePrisma: false, // Already deleted by setCustomClaimsWithRetry
          context: 'google-oauth-claims-failure',
        });
      } catch (rollbackError) {
        // Log with hashed identifiers to prevent PII leakage
        logger.error(
          'CRITICAL: Failed to delete Google-created Firebase user after claims failure',
          {
            firebaseUidHash: hashPII(firebaseUid),
            emailHash: hashPII(email),
            rollbackError:
              rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          }
        );
      }

      throw claimError; // Re-throw to inform client
    }

    // Log with hashed identifiers to prevent PII leakage
    logger.info('User registered with Google', createSafeLogIdentifier(user.id, user.email));

    return successResponse({ user }, 'Registration successful', 201);
  } catch (error) {
    // Handle race condition: concurrent requests trying to create the same user
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      // Log with hashed UID to prevent PII leakage
      logger.info('Concurrent user creation detected, fetching existing user', {
        firebaseUidHash: hashPII(firebaseUid),
      });

      // User was created by another concurrent request, fetch and update it
      user = await prisma.user.update({
        where: { firebaseId: firebaseUid },
        data: { lastLogin: new Date() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          city: true,
          country: true,
          role: true,
          isActive: true,
          isVerified: true,
          firebaseId: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });

      logger.info('User logged in with Google (after race condition)', { userId: user.id });
      return successResponse({ user }, 'Login successful');
    }

    // ApiError from setCustomClaimsWithRetry (includes rollback info)
    if (error instanceof ApiError) {
      // Log with hashed identifiers to prevent PII leakage
      logger.error('Google OAuth registration failed', {
        error: error.message,
        firebaseUidHash: hashPII(firebaseUid),
        emailHash: hashPII(email),
        statusCode: error.statusCode,
      });
      throw error;
    }

    // For any other error, log and rethrow (hash PII)
    logger.error('Error creating user with Google', {
      error,
      firebaseUidHash: hashPII(firebaseUid),
      emailHash: hashPII(email),
    });
    throw error;
  }
});

// Apply middleware
export const POST = withCorsMiddleware(withRateLimit(handler, RateLimitPresets.AUTH));
