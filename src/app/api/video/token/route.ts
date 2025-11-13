import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ERROR_MESSAGES } from '@/lib/constants';
import { ApiError, HttpStatus, asyncHandler } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { buildPrivilegePayload, generateToken, TokenGenerationError } from '@/lib/zego/token';

const DEFAULT_EXPIRY_SECONDS = 60 * 30; // 30 minutes
const MAX_EXPIRY_SECONDS = 60 * 60 * 4; // 4 hours
const MIN_EXPIRY_SECONDS = 60; // 1 minute

interface TokenRequestBody {
  roomId: string;
  expiresInSeconds?: number;
  canPublish?: boolean;
  canLogin?: boolean;
  streamIds?: string[];
  metadata?: Record<string, unknown>;
}

const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  let body: TokenRequestBody;

  try {
    body = (await request.json()) as TokenRequestBody;
  } catch (error) {
    logger.warn('Invalid JSON payload for token request', { error });
    throw new ApiError('Invalid JSON payload', HttpStatus.BAD_REQUEST);
  }

  const {
    roomId,
    expiresInSeconds,
    canPublish = true,
    canLogin = true,
    streamIds,
    metadata,
  } = body;

  if (typeof roomId !== 'string' || roomId.trim().length === 0) {
    throw new ApiError('roomId must be a non-empty string', HttpStatus.BAD_REQUEST);
  }

  if (streamIds && !Array.isArray(streamIds)) {
    throw new ApiError('streamIds must be an array of strings', HttpStatus.BAD_REQUEST);
  }

  if (streamIds && !streamIds.every((id) => typeof id === 'string' && id.trim().length > 0)) {
    throw new ApiError('streamIds must contain non-empty strings', HttpStatus.BAD_REQUEST);
  }

  const rawAppId =
    process.env.ZEGOCLOUD_APP_ID ??
    process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID ??
    process.env.NEXT_PUBLIC_APP_ID;
  const appId = rawAppId ? Number.parseInt(rawAppId, 10) : NaN;

  const serverSecret =
    process.env.ZEGOCLOUD_SERVER_SECRET ??
    process.env.ZEGOCLOUD_APP_SECRET ??
    process.env.NEXT_PUBLIC_APP_SIGNIN ??
    process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_SIGNIN;

  if (!Number.isFinite(appId) || appId <= 0) {
    logger.error('ZegoCloud app ID is not configured correctly');
    throw new ApiError('Video service is not configured correctly', HttpStatus.SERVICE_UNAVAILABLE);
  }

  if (!serverSecret) {
    logger.error('ZegoCloud server secret is missing. Tokens cannot be generated securely.');
    throw new ApiError('Video service is not configured correctly', HttpStatus.SERVICE_UNAVAILABLE);
  }

  if (!process.env.ZEGOCLOUD_SERVER_SECRET && !process.env.ZEGOCLOUD_APP_SECRET) {
    logger.warn(
      'Using public app sign for token generation. Move credentials to server-only envs.'
    );
  }

  const userId = req.user.userId || req.user.uid;

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    logger.error('Authenticated request missing user identifier', { user: req.user });
    throw new ApiError(
      'Unable to determine user identifier for token request',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  const safeExpiry = Math.min(
    Math.max(
      Number.isFinite(expiresInSeconds || NaN)
        ? Math.floor(expiresInSeconds as number)
        : DEFAULT_EXPIRY_SECONDS,
      MIN_EXPIRY_SECONDS
    ),
    MAX_EXPIRY_SECONDS
  );

  const payload = buildPrivilegePayload({
    roomId: roomId.trim(),
    canLogin,
    canPublish,
    streamIds,
    extra: metadata,
  });

  try {
    const token = generateToken({
      appId,
      userId,
      secret: serverSecret,
      effectiveTimeInSeconds: safeExpiry,
      payload,
    });

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + safeExpiry * 1000);

    return NextResponse.json({
      success: true,
      data: {
        token,
        appId,
        userId,
        roomId: roomId.trim(),
        expiresAt: expiresAt.toISOString(),
        issuedAt: issuedAt.toISOString(),
        durationSeconds: safeExpiry,
      },
    });
  } catch (error) {
    if (error instanceof TokenGenerationError) {
      logger.error('Failed to generate Zego token', {
        error: error.message,
        code: error.code,
        userId,
        roomId,
      });
      throw new ApiError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    logger.error('Unexpected error generating Zego token', error, { userId, roomId });
    throw new ApiError('Failed to generate token', HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

const authenticatedPost = authenticateToken(postHandler);

export const POST = withCorsMiddleware(
  withRateLimit(authenticatedPost, {
    ...RateLimitPresets.STANDARD,
    maxRequests: 20,
    windowMs: 60 * 1000,
  })
);
