// PII Hashing utility for secure logging
// Purpose: Hash sensitive user data (email, uid) before logging to prevent PII leakage
// Uses HMAC-SHA256 with a server-side secret for non-reversible hashing

import { createHmac } from 'crypto';

/**
 * Hashes PII data using HMAC-SHA256 with a server-side secret
 * Returns a truncated hash suitable for logging and debugging
 *
 * @param value - The PII value to hash (email, uid, etc.)
 * @returns Truncated hash string (first 16 chars) or 'unknown' if value is empty
 *
 * @example
 * // In logs instead of: { email: 'user@example.com', uid: 'abc123' }
 * // Use: { emailHash: hashPII('user@example.com'), uidHash: hashPII('abc123') }
 */
export function hashPII(value: string | null | undefined): string {
  if (!value) return 'unknown';

  // Get secret from environment variable
  // If not set, use a warning placeholder (development fallback)
  const secret = process.env.PII_HASH_SECRET || 'CHANGE_ME_IN_PRODUCTION';

  if (secret === 'CHANGE_ME_IN_PRODUCTION' && process.env.NODE_ENV === 'production') {
    console.warn(
      'WARNING: PII_HASH_SECRET not set in production. Set this environment variable for secure PII hashing.'
    );
  }

  // Create HMAC-SHA256 hash
  const hmac = createHmac('sha256', secret);
  hmac.update(value);
  const hash = hmac.digest('hex');

  // Return truncated hash (first 16 chars) for logging
  // This is enough to identify unique users in logs while preventing reversibility
  return hash.substring(0, 16);
}

/**
 * Helper to create a safe log object with hashed PII
 *
 * @param uid - User's Firebase UID
 * @param email - User's email address
 * @returns Object with hashed identifiers safe for logging
 */
export function createSafeLogIdentifier(uid?: string | null, email?: string | null) {
  return {
    userIdHash: hashPII(uid),
    emailHash: hashPII(email),
  };
}
