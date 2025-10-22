// POST /api/admin/invite-codes/validate - Validate invite code
// Public endpoint (no auth required) - used during registration
//
// IMPORTANT: This endpoint provides ADVISORY validation only.
// The response indicates whether an invite code is currently valid, but due to
// potential race conditions (TOCTOU - Time-Of-Check-Time-Of-Use), the code may
// become invalid between this check and actual usage during registration.
//
// AUTHORITATIVE validation and enforcement happens in the registration endpoint,
// which validates and consumes the invite code atomically within a database transaction.
// Multiple clients may receive "valid" responses but only those within maxUses will
// successfully complete registration.

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { validateInviteCodeRules } from '@/lib/utils/invite-code-validation';

const handler = asyncHandler(async (request: NextRequest) => {
  const { code } = await request.json();

  if (!code) {
    throw new ApiError('Invite code is required', HttpStatus.BAD_REQUEST);
  }

  // Find invite code (read-only check for advisory validation)
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      role: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      isActive: true,
    },
  });

  // Apply shared validation rules (advisory only - see header comments)
  validateInviteCodeRules(inviteCode);

  return successResponse(
    {
      role: inviteCode!.role,
      valid: true,
    },
    'Invite code is valid'
  );
});

export const POST = withCorsMiddleware(handler);
