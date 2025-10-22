// Messages API Routes - DEPRECATED
// ⚠️ This API layer is no longer needed - use direct Firebase client-side
//
// MIGRATION: All messaging now uses Firebase Realtime Database directly from client
// - Web app: Uses hooks in src/features/messages/hooks/useRealtimeChat.ts
// - Mobile app: Uses same Firebase SDK with chat.service.ts functions
//
// Benefits:
// - Faster (no API overhead)
// - True real-time (WebSocket)
// - Better offline support
// - Lower server costs
//
// Security: Managed by Firebase Security Rules (see firebase-security-rules.json)

import { NextRequest } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
// DEPRECATED: These functions don't exist - messaging is now client-side Firebase only
// import { sendMessage, getUserChatRooms } from '@/lib/firebase/chat.service';

// GET /api/messages - Get user's conversations
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // DEPRECATED: This endpoint is no longer used - clients access Firebase directly
  logger.warn('Deprecated /api/messages GET endpoint called', {
    userId: req.user.userId,
  });

  return successResponse(
    {
      conversations: [],
      deprecated: true,
      message: 'This API is deprecated. Use Firebase Realtime Database directly from client.',
    },
    'Use client-side Firebase access',
    HttpStatus.OK
  );
});

// POST /api/messages - Send a new message
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // DEPRECATED: This endpoint is no longer used - clients send messages via Firebase directly
  logger.warn('Deprecated /api/messages POST endpoint called', {
    userId: req.user.userId,
  });

  return successResponse(
    {
      deprecated: true,
      message: 'This API is deprecated. Use Firebase Realtime Database directly from client.',
    },
    'Use client-side Firebase access',
    HttpStatus.OK
  );
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
