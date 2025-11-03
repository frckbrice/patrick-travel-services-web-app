// GET /api/users/[id]/firebase-uid - Get Firebase UID from PostgreSQL user ID
// Used by client-side code to convert PostgreSQL IDs to Firebase UIDs

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id]/firebase-uid - Get Firebase UID from PostgreSQL ID
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Invalid user ID', HttpStatus.BAD_REQUEST);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, firebaseId: true },
    });

    if (!user) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    logger.debug('Firebase UID retrieved', {
      postgresId: id,
      requestedBy: req.user.userId,
    });

    return successResponse({ firebaseId: user.firebaseId }, 'Firebase UID retrieved successfully');
  } catch (error) {
    logger.error('Failed to get Firebase UID', error, {
      postgresId: id,
      requestedBy: req.user.userId,
    });
    throw error;
  }
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
