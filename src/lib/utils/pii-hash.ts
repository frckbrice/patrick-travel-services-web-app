// PII Hashing utility for secure logging
// Purpose: Hash sensitive user data (email, uid) before logging to prevent PII leakage
// Uses a lightweight hashing strategy with a secret salt for non-reversible hashing

import { logger } from './logger';

/**
 * Simple FNV-1a 32-bit hash implementation that works in both browser and Node runtimes.
 * Returns an 8 character hex string.
 */
function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // Ensure unsigned 32-bit and return as zero-padded hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Hashes PII data using a deterministic hashing strategy with a secret salt.
 * Returns a truncated hash suitable for logging and debugging.
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

  // Get secret from environment variable. If not set, use a warning placeholder (development fallback)
  const secret = process.env.PII_HASH_SECRET || 'CHANGE_ME_IN_PRODUCTION';

  if (secret === 'CHANGE_ME_IN_PRODUCTION') {
    logger.warn(
      'PII_HASH_SECRET not set in production. Set this environment variable for secure PII hashing.'
    );
  }

  // Combine value with secret so hashes differ across deployments/environments
  const saltedValue = `${value}:${secret}`;

  // Derive two FNV hashes (forward + reversed) to provide 16 hex chars.
  const forwardHash = fnv1aHash(saltedValue);
  const reverseHash = fnv1aHash([...saltedValue].reverse().join(''));

  // Return truncated hash (first 16 chars) for logging.
  // This is enough to identify unique users in logs while preventing reversibility.
  return `${forwardHash}${reverseHash}`.substring(0, 16);
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
