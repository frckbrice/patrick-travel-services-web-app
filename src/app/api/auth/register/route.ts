// POST /api/auth/register - Register new user with Firebase Auth
// This endpoint creates users server-side with proper validation order and rollback
// Security: Never trusts client-created Firebase users, prevents orphaned accounts
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
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { validateInviteCodeRules } from '@/lib/utils/invite-code-validation';
import { setCustomClaimsWithRetry, rollbackUserCreation } from '@/lib/utils/firebase-claims';
import { hashPII, createSafeLogIdentifier } from '@/lib/utils/pii-hash';

const handler = asyncHandler(async (request: NextRequest) => {
  // Check if Firebase Admin is initialized
  if (!adminAuth) {
    logger.error('Firebase Admin not initialized');
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  const body = await request.json();

  // Validate input (includes password)
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

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    inviteCode,
    consentedAt,
    acceptedTerms,
    acceptedPrivacy,
  } = validationResult.data;

  // SECURITY: Check if email already exists in Firebase before any operations
  try {
    await adminAuth.getUserByEmail(email);
    // If we get here, user exists - log with hashed email to prevent PII leakage
    logger.warn('Registration attempt with existing email', { emailHash: hashPII(email) });
    return errorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS, 409);
  } catch (error: any) {
    // Error code 'auth/user-not-found' means email is available (expected path)
    if (error.code !== 'auth/user-not-found') {
      // Log with hashed email to prevent PII leakage
      logger.error('Error checking existing user', {
        emailHash: hashPII(email),
        error: error.message,
      });
      throw new ApiError('Failed to validate user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // Email is available, continue registration
  }

  // Determine role based on invite code
  let userRole: 'CLIENT' | 'AGENT' | 'ADMIN' = 'CLIENT';
  let validatedInvite: any = null;

  // STEP 1: Validate invite code FIRST (before creating anything)
  if (inviteCode) {
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    // Validate the invite code - throws ApiError if invalid
    validateInviteCodeRules(invite);
    validatedInvite = invite!;
    userRole = validatedInvite.role;

    logger.info('Invite code validated', { code: inviteCode, role: userRole });
  }

  // STEP 2: Create Firebase user server-side (only after validation passes)
  let firebaseUid: string;
  try {
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
      displayName: `${firstName} ${lastName}`,
    });

    firebaseUid = firebaseUser.uid;

    // Log with hashed identifiers to prevent PII leakage
    logger.info('Firebase user created server-side', {
      firebaseUidHash: hashPII(firebaseUid),
      emailHash: hashPII(email),
      role: userRole,
    });
  } catch (error: any) {
    // Log with hashed email to prevent PII leakage
    logger.error('Failed to create Firebase user', {
      emailHash: hashPII(email),
      error: error.message,
      code: error.code,
    });

    if (error.code === 'auth/email-already-exists') {
      return errorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS, 409);
    }
    throw new ApiError('Failed to create authentication account', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // STEP 3: Create DB user and consume invite code atomically in transaction
  let user;
  try {
    // Prepare GDPR consent data
    const consentTimestamp = consentedAt ? new Date(consentedAt) : undefined;
    const gdprData = consentedAt
      ? {
          consentedAt: consentTimestamp,
          acceptedTerms: acceptedTerms ?? false,
          acceptedPrivacy: acceptedPrivacy ?? false,
          termsAcceptedAt: acceptedTerms ? consentTimestamp : undefined,
          privacyAcceptedAt: acceptedPrivacy ? consentTimestamp : undefined,
        }
      : {};

    if (inviteCode && validatedInvite) {
      // Registration with invite code - atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the database user
        const newUser = await tx.user.create({
          data: {
            email,
            password: randomBytes(32).toString('hex'), // Not used for Firebase auth
            firstName,
            lastName,
            phone,
            role: userRole,
            isActive: true, // Explicitly set account as active
            isVerified: false,
            firebaseId: firebaseUid,
            ...gdprData, // Include GDPR consent fields
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
            consentedAt: true,
            acceptedTerms: true,
            acceptedPrivacy: true,
            termsAcceptedAt: true,
            privacyAcceptedAt: true,
            dataExportRequests: true,
            lastDataExport: true,
          },
        });

        // Atomically update invite code usage with conditional check
        const updateResult = await tx.$executeRaw`
                    UPDATE "InviteCode"
                    SET
                        "usedCount" = "usedCount" + 1,
                        "lastUsedById" = ${newUser.id},
                        "lastUsedAt" = NOW()
                    WHERE
                        "id" = ${validatedInvite.id}
                        AND "isActive" = true
                        AND "expiresAt" > NOW()
                        AND "usedCount" < "maxUses"
                `;

        // If no rows affected, invite was exhausted by concurrent request
        if (updateResult === 0) {
          throw new ApiError('This invite code has reached its usage limit', HttpStatus.CONFLICT);
        }

        // Record usage history for audit trail
        await tx.inviteUsage.create({
          data: {
            inviteCodeId: validatedInvite.id,
            userId: newUser.id,
            usedAt: new Date(),
          },
        });

        return newUser;
      });

      user = result;
      // Log with hashed UID to prevent PII leakage (invite code is not PII)
      logger.info('User and invite code processed atomically', {
        userIdHash: hashPII(firebaseUid),
        code: inviteCode,
        role: userRole,
      });
    } else {
      // No invite code - create user with default CLIENT role
      user = await prisma.user.create({
        data: {
          email,
          password: randomBytes(32).toString('hex'), // Not used for Firebase auth
          firstName,
          lastName,
          phone,
          role: userRole,
          isActive: true, // Explicitly set account as active
          isVerified: false,
          firebaseId: firebaseUid,
          ...gdprData, // Include GDPR consent fields
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
          consentedAt: true,
          acceptedTerms: true,
          acceptedPrivacy: true,
          termsAcceptedAt: true,
          privacyAcceptedAt: true,
          dataExportRequests: true,
          lastDataExport: true,
        },
      });

      // Log with hashed UID to prevent PII leakage
      logger.info('User created without invite code', {
        userIdHash: hashPII(firebaseUid),
        role: userRole,
      });
    }
  } catch (error) {
    // CRITICAL: Database operation failed - ROLLBACK Firebase user
    // Log with hashed identifiers to prevent PII leakage
    logger.error('Database user creation failed, rolling back Firebase user', {
      firebaseUidHash: hashPII(firebaseUid),
      emailHash: hashPII(email),
      error: error instanceof Error ? error.message : String(error),
    });

    // Attempt to delete the Firebase user we just created
    try {
      await rollbackUserCreation(firebaseUid, {
        deleteFirebase: true,
        deletePrisma: false, // DB user was never created
        context: 'registration-db-failure',
      });
    } catch (rollbackError) {
      // Log with hashed identifiers to prevent PII leakage
      logger.error('CRITICAL: Failed to rollback Firebase user after DB failure', {
        firebaseUidHash: hashPII(firebaseUid),
        emailHash: hashPII(email),
        rollbackError:
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
      });
    }

    // Handle Prisma unique constraint violation (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS, 409);
    }

    // Re-throw ApiErrors (validation failures, invite exhausted, etc.)
    if (error instanceof ApiError) {
      throw error;
    }

    // Any other error
    throw new ApiError('Registration failed. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // STEP 4: Set custom claims with retry and automatic rollback on failure
  try {
    await setCustomClaimsWithRetry(firebaseUid, {
      role: userRole,
      userId: user.id,
    });
  } catch (error) {
    // Claims setting failed even after retries
    // The setCustomClaimsWithRetry already deleted the DB user
    // We need to also delete the Firebase user
    // Log with hashed identifiers to prevent PII leakage
    logger.error('Claims setting failed, rolling back Firebase user', {
      firebaseUidHash: hashPII(firebaseUid),
      emailHash: hashPII(email),
    });

    try {
      await rollbackUserCreation(firebaseUid, {
        deleteFirebase: true,
        deletePrisma: false, // Already deleted by setCustomClaimsWithRetry
        context: 'registration-claims-failure',
      });
    } catch (rollbackError) {
      // Log with hashed identifiers to prevent PII leakage
      logger.error('CRITICAL: Failed to rollback Firebase user after claims failure', {
        firebaseUidHash: hashPII(firebaseUid),
        emailHash: hashPII(email),
        rollbackError:
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
      });
    }

    throw error; // Re-throw the original error
  }

  // STEP 5: Generate custom token for client to sign in
  let customToken: string;
  try {
    customToken = await adminAuth.createCustomToken(firebaseUid);
  } catch (error: any) {
    // Log with hashed UID to prevent PII leakage
    logger.error('Failed to create custom token', {
      firebaseUidHash: hashPII(firebaseUid),
      error: error.message,
    });
    throw new ApiError(
      'Registration succeeded but failed to create session token. Please try logging in.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Log with hashed identifiers to prevent PII leakage
  logger.info('User registered successfully', createSafeLogIdentifier(user.id, user.email));
  logger.info('User registered successfully - additional context', {
    role: userRole,
  });

  return successResponse(
    {
      user,
      customToken, // Client will use this to sign in
    },
    SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
    201
  );
});

// Apply middleware: CORS -> Rate Limit -> Handler
export const POST = withCorsMiddleware(withRateLimit(handler, RateLimitPresets.AUTH));
