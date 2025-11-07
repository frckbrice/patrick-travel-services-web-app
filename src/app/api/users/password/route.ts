import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { ERROR_MESSAGES } from '@/lib/constants';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'current-password-required'),
  newPassword: z
    .string()
    .min(8, 'password-too-weak')
    .regex(/[A-Z]/, 'password-too-weak')
    .regex(/[a-z]/, 'password-too-weak')
    .regex(/[0-9]/, 'password-too-weak'),
});

const MAX_AUTH_AGE_SECONDS = 5 * 60; // 5 minutes

async function verifyCurrentPassword(email: string, password: string) {
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!apiKey) {
    throw new ApiError(
      'Password verification unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      null,
      'firebase-api-key-missing'
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false,
      }),
    }
  );

  const payload = (await response.json().catch(() => undefined)) as
    | { error?: { message?: string } }
    | undefined;

  if (response.ok) {
    return true;
  }

  const errorMessage = payload?.error?.message || 'INVALID_PASSWORD';

  if (errorMessage === 'INVALID_PASSWORD') {
    return false;
  }

  if (errorMessage === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
    throw new ApiError('too-many-attempts', HttpStatus.TOO_MANY_REQUESTS);
  }

  logger.error('Unexpected Firebase password verification error', {
    email,
    error: errorMessage,
  });

  throw new ApiError('password-verification-failed', HttpStatus.INTERNAL_SERVER_ERROR);
}

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user || !req.firebaseToken) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json().catch(() => null);
  const validation = changePasswordSchema.safeParse(body);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    return errorResponse(firstIssue.message, HttpStatus.BAD_REQUEST);
  }

  const { currentPassword, newPassword } = validation.data;

  // Enforce recent re-authentication on the client by checking auth_time
  const authTime = req.firebaseToken.auth_time;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!authTime || nowSeconds - authTime > MAX_AUTH_AGE_SECONDS) {
    return errorResponse('reauth_required', HttpStatus.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      password: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const passwordMatches = await verifyCurrentPassword(user.email, currentPassword);

  if (!passwordMatches) {
    return errorResponse('current-password-incorrect', HttpStatus.BAD_REQUEST);
  }

  if (currentPassword === newPassword) {
    return errorResponse('password-unchanged', HttpStatus.BAD_REQUEST);
  }

  if (!adminAuth) {
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  try {
    await adminAuth.updateUser(user.id, { password: newPassword });
  } catch (error) {
    logger.error('Failed to update user password in Firebase', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('password-update-failed', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  try {
    await adminAuth.revokeRefreshTokens(user.id);
  } catch (error) {
    logger.warn('Failed to revoke refresh tokens after password change', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: randomBytes(32).toString('hex'),
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  logger.info('User password updated', { userId: user.id });

  return successResponse(undefined, 'Password updated');
});

export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
