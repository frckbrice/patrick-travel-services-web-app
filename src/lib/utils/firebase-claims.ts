/**
 * Firebase Custom Claims Utility
 *
 * Provides robust handling for setting Firebase custom claims with retry logic
 * and automatic rollback on persistent failures to ensure data integrity between
 * Firebase Auth and Prisma database.
 */

import { adminAuth } from '@/lib/firebase/firebase-admin';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { hashPII } from '@/lib/utils/pii-hash';

interface CustomClaims {
  role: string;
  userId: string;
}

interface SetCustomClaimsOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 100
   */
  initialDelayMs?: number;

  /**
   * Whether to rollback (delete) the user on persistent failure
   * @default true
   */
  rollbackOnFailure?: boolean;
}

/**
 * Sets custom claims for a Firebase user with retry logic and automatic rollback.
 *
 * This function ensures data integrity between Firebase Auth and the Prisma database
 * by implementing:
 * 1. Retry mechanism with exponential backoff for transient failures
 * 2. Automatic rollback (user deletion) on persistent failures
 * 3. Comprehensive logging for audit trail
 *
 * @param firebaseUid - The Firebase UID of the user
 * @param claims - The custom claims to set
 * @param options - Configuration options for retry and rollback behavior
 * @throws {ApiError} If all retry attempts fail and rollback is disabled, or if rollback fails
 */
export async function setCustomClaimsWithRetry(
  firebaseUid: string,
  claims: CustomClaims,
  options: SetCustomClaimsOptions = {}
): Promise<void> {
  const { maxRetries = 3, initialDelayMs = 100, rollbackOnFailure = true } = options;

  if (!adminAuth) {
    throw new ApiError('Firebase Admin not initialized', HttpStatus.SERVICE_UNAVAILABLE);
  }

  let lastError: Error | null = null;

  // Attempt to set custom claims with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await adminAuth.setCustomUserClaims(firebaseUid, claims);

      // Log with hashed identifiers to prevent PII leakage
      logger.info('Custom claims set successfully', {
        firebaseUidHash: hashPII(firebaseUid),
        userIdHash: hashPII(claims.userId),
        role: claims.role,
        attempt: attempt > 1 ? attempt : undefined,
      });

      return; // Success!
    } catch (error) {
      lastError = error as Error;

      // Log with hashed identifiers to prevent PII leakage
      logger.warn('Failed to set custom claims', {
        firebaseUidHash: hashPII(firebaseUid),
        userIdHash: hashPII(claims.userId),
        role: claims.role,
        attempt,
        maxRetries,
        error: lastError.message,
      });

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        // Log with hashed UID to prevent PII leakage
        logger.info('Retrying setCustomUserClaims', {
          firebaseUidHash: hashPII(firebaseUid),
          nextAttempt: attempt + 1,
          delayMs,
        });
        await sleep(delayMs);
      }
    }
  }

  // All retries exhausted - log persistent failure with hashed identifiers to prevent PII leakage
  logger.error('All attempts to set custom claims failed', {
    firebaseUidHash: hashPII(firebaseUid),
    userIdHash: hashPII(claims.userId),
    role: claims.role,
    maxRetries,
    lastError: lastError?.message,
  });

  // Rollback: delete the user to maintain data integrity
  if (rollbackOnFailure) {
    // Log with hashed UID to prevent PII leakage
    logger.warn('Rolling back user creation due to claim setting failure', {
      firebaseUidHash: hashPII(firebaseUid),
    });

    try {
      await prisma.user.delete({
        where: { id: firebaseUid },
      });

      // Log with hashed UID to prevent PII leakage
      logger.info('User successfully rolled back (deleted)', {
        firebaseUidHash: hashPII(firebaseUid),
      });
    } catch (deleteError) {
      // Log deletion failure but don't throw - we want to report the original error
      // Log with hashed UID to prevent PII leakage
      logger.error('Failed to rollback (delete) user after claim setting failure', {
        firebaseUidHash: hashPII(firebaseUid),
        deleteError: deleteError instanceof Error ? deleteError.message : String(deleteError),
        originalError: lastError?.message,
      });

      // This is a critical inconsistency - user exists in DB but has no claims
      throw new ApiError(
        'Failed to set user claims and rollback failed. Manual intervention required.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          firebaseUid,
          claimError: lastError?.message,
          deleteError: deleteError instanceof Error ? deleteError.message : String(deleteError),
        }
      );
    }

    // Rollback successful - throw error to inform caller
    throw new ApiError(
      'Failed to set Firebase custom claims after multiple attempts. User creation has been rolled back.',
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        firebaseUid,
        attempts: maxRetries,
        lastError: lastError?.message,
      }
    );
  } else {
    // Rollback disabled - just throw error
    throw new ApiError(
      'Failed to set Firebase custom claims after multiple attempts',
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        firebaseUid,
        attempts: maxRetries,
        lastError: lastError?.message,
      }
    );
  }
}

/**
 * Deletes a Firebase Auth user account.
 * Used for rollback when database operations fail after Firebase user creation.
 *
 * @param firebaseUid - The Firebase UID to delete
 * @throws {ApiError} If deletion fails
 */
export async function deleteFirebaseUser(firebaseUid: string): Promise<void> {
  if (!adminAuth) {
    throw new ApiError('Firebase Admin not initialized', HttpStatus.SERVICE_UNAVAILABLE);
  }

  try {
    await adminAuth.deleteUser(firebaseUid);
    // Log with hashed UID to prevent PII leakage
    logger.info('Firebase user deleted successfully', { firebaseUidHash: hashPII(firebaseUid) });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Log with hashed UID to prevent PII leakage
    logger.error('Failed to delete Firebase user', {
      firebaseUidHash: hashPII(firebaseUid),
      error: errorMessage,
    });
    throw new ApiError(
      'Failed to delete Firebase user during rollback',
      HttpStatus.INTERNAL_SERVER_ERROR,
      { firebaseUid, error: errorMessage }
    );
  }
}

/**
 * Rolls back both Firebase Auth and Prisma database user on registration failure.
 * Ensures no orphaned accounts remain in either system.
 *
 * @param firebaseUid - The Firebase UID to clean up
 * @param options - Rollback configuration
 */
export async function rollbackUserCreation(
  firebaseUid: string,
  options: {
    deleteFirebase?: boolean;
    deletePrisma?: boolean;
    context?: string;
  } = {}
): Promise<void> {
  const { deleteFirebase = true, deletePrisma = true, context = 'registration' } = options;

  const errors: string[] = [];

  // Try to delete Firebase user first
  if (deleteFirebase) {
    try {
      await deleteFirebaseUser(firebaseUid);
      // Log with hashed UID to prevent PII leakage
      logger.info('Firebase user rolled back', { firebaseUidHash: hashPII(firebaseUid), context });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Firebase deletion failed: ${errorMsg}`);
      // Log with hashed UID to prevent PII leakage
      logger.error('Failed to rollback Firebase user', {
        firebaseUidHash: hashPII(firebaseUid),
        context,
        error: errorMsg,
      });
    }
  }

  // Try to delete Prisma user
  if (deletePrisma) {
    try {
      await prisma.user.delete({
        where: { id: firebaseUid },
      });
      // Log with hashed UID to prevent PII leakage
      logger.info('Prisma user rolled back', { firebaseUidHash: hashPII(firebaseUid), context });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Don't add to errors if user doesn't exist (P2025)
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) {
        errors.push(`Prisma deletion failed: ${errorMsg}`);
        // Log with hashed UID to prevent PII leakage
        logger.error('Failed to rollback Prisma user', {
          firebaseUidHash: hashPII(firebaseUid),
          context,
          error: errorMsg,
        });
      }
    }
  }

  if (errors.length > 0) {
    throw new ApiError(
      `Rollback incomplete: ${errors.join('; ')}. Manual cleanup may be required.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { firebaseUid, context, errors }
    );
  }
}

/**
 * Sleep utility for implementing exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
