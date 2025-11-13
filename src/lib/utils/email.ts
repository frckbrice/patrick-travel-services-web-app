// Utility helpers for email normalization and comparison

/**
 * Normalize an email address for consistent storage and comparisons.
 * - Trims surrounding whitespace
 * - Converts to lowercase (safe for real-world providers and RFC-compliant)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
