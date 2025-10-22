// Shared invite code validation logic
// This utility provides validation functions that can be used across endpoints

import { ApiError, HttpStatus } from './error-handler';

/**
 * Validates invite code business rules (active, not expired, not exhausted)
 * NOTE: This is a stateless check and does NOT guarantee atomicity.
 * For authoritative validation during consumption, the registration endpoint
 * re-validates these same conditions atomically within a database transaction
 * using a conditional UPDATE statement.
 *
 * @param inviteCode - The invite code record from the database (or null)
 * @throws ApiError if validation fails
 */
export function validateInviteCodeRules(
  inviteCode: {
    isActive: boolean;
    expiresAt: Date;
    usedCount: number;
    maxUses: number;
  } | null
): void {
  if (!inviteCode) {
    throw new ApiError('Invalid or expired invite code', HttpStatus.FORBIDDEN);
  }

  if (!inviteCode.isActive) {
    throw new ApiError('This invite code has been deactivated', HttpStatus.FORBIDDEN);
  }

  if (new Date() > inviteCode.expiresAt) {
    throw new ApiError('This invite code has expired', HttpStatus.FORBIDDEN);
  }

  if (inviteCode.usedCount >= inviteCode.maxUses) {
    throw new ApiError('This invite code has reached its usage limit', HttpStatus.FORBIDDEN);
  }
}

/**
 * Type for invite code validation result
 */
export interface ValidatedInviteCode {
  id: string;
  code: string;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  isActive: boolean;
}
