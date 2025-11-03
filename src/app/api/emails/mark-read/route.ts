// Mark multiple emails as read API Route
// PUT /api/emails/mark-read

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// PUT /api/emails/mark-read - Mark multiple emails as read
const putHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  try {
    const body = await request.json();
    const { emailIds } = body;

    // Validation
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      throw new ApiError(
        'emailIds array is required and must not be empty',
        HttpStatus.BAD_REQUEST
      );
    }

    // Limit batch size for performance
    if (emailIds.length > 100) {
      throw new ApiError(
        'Cannot mark more than 100 emails as read at once',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate email IDs format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = emailIds.filter((id) => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      throw new ApiError(`Invalid email IDs: ${invalidIds.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    const readAt = new Date();

    // Update all emails as read in a single transaction
    const result = await prisma.message.updateMany({
      where: {
        id: { in: emailIds },
        messageType: 'EMAIL',
        recipientId: req.user.userId, // Only user's received emails
        isRead: false, // Only update unread emails
      },
      data: {
        isRead: true,
        readAt,
      },
    });

    logger.info('Multiple emails marked as read', {
      userId: req.user.userId,
      requestedCount: emailIds.length,
      updatedCount: result.count,
      readAt: readAt.toISOString(),
    });

    return successResponse(
      {
        requestedCount: emailIds.length,
        updatedCount: result.count,
        skippedCount: emailIds.length - result.count,
        readAt: readAt.toISOString(),
      },
      `${result.count} email(s) marked as read successfully`
    );
  } catch (error) {
    logger.error('Failed to mark multiple emails as read', {
      userId: req.user.userId,
      error: (error as Error)?.message,
    });
    throw error;
  }
});

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);
