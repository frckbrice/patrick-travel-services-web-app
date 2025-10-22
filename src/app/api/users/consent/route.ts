// PATCH /api/users/consent - Update user GDPR consent
// Used when existing users (registered on web) need to provide consent on mobile

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const updateConsentSchema = z.object({
  acceptedTerms: z.boolean().optional(),
  acceptedPrivacy: z.boolean().optional(),
  consentedAt: z.string().datetime().optional(), // ISO timestamp
});

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const userId = req.user.userId;

  const body = await request.json();
  const validationResult = updateConsentSchema.safeParse(body);

  if (!validationResult.success) {
    throw new ApiError(
      'Invalid input: ' +
        validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      HttpStatus.BAD_REQUEST
    );
  }

  const { acceptedTerms, acceptedPrivacy, consentedAt } = validationResult.data;

  // Prepare update data
  const consentTimestamp = consentedAt ? new Date(consentedAt) : new Date();
  const updateData: any = {};

  // Update overall consent timestamp if not already set
  if (consentedAt) {
    updateData.consentedAt = consentTimestamp;
  }

  // Update terms acceptance
  if (acceptedTerms !== undefined) {
    updateData.acceptedTerms = acceptedTerms;
    if (acceptedTerms) {
      updateData.termsAcceptedAt = consentTimestamp;
    }
  }

  // Update privacy acceptance
  if (acceptedPrivacy !== undefined) {
    updateData.acceptedPrivacy = acceptedPrivacy;
    if (acceptedPrivacy) {
      updateData.privacyAcceptedAt = consentTimestamp;
    }
  }

  // Update user consent
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      consentedAt: true,
      acceptedTerms: true,
      acceptedPrivacy: true,
      termsAcceptedAt: true,
      privacyAcceptedAt: true,
      dataExportRequests: true,
      lastDataExport: true,
    },
  });

  logger.info('User consent updated', {
    userId,
    acceptedTerms: updatedUser.acceptedTerms,
    acceptedPrivacy: updatedUser.acceptedPrivacy,
  });

  return successResponse({ user: updatedUser }, 'Consent updated successfully');
});

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
