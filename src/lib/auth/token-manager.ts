// Secure token management - tokens are never stored in localStorage
// Only retrieved on-demand from Firebase Auth

import { auth } from '@/lib/firebase/firebase-client';
import { logger } from '@/lib/utils/logger';

/**
 * Get fresh Firebase ID token
 * Tokens are retrieved on-demand and never persisted in localStorage
 * Firebase automatically handles token refresh if needed
 *
 * @param forceRefresh - Force token refresh even if not expired
 * @returns Firebase ID token or null if not authenticated
 */
export async function getFreshToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;

  if (!user) {
    logger.warn('No authenticated Firebase user, cannot get token');
    return null;
  }

  try {
    // Firebase automatically refreshes if token is expired
    // forceRefresh will get a new token even if current one is valid
    const token = await user.getIdToken(forceRefresh);
    logger.debug('Successfully retrieved Firebase token', { userId: user.uid });
    return token;
  } catch (error) {
    logger.error('Failed to get Firebase token', error);
    return null;
  }
}

/**
 * Check if user is currently authenticated
 * @returns true if Firebase user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Get current Firebase user ID
 * @returns Firebase UID or null
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Get current Firebase user email
 * @returns User email or null
 */
export function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email || null;
}

/**
 * Force refresh the current token
 * Useful before critical operations
 * @returns Fresh token or null
 */
export async function forceTokenRefresh(): Promise<string | null> {
  return getFreshToken(true);
}
