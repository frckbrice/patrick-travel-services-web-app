'use client';

// Firebase Auth state listener provider

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { useAuthStore } from '@/features/auth/store';
import { logger } from '@/lib/utils/logger';
import { createSafeLogIdentifier } from '@/lib/utils/pii-hash';

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, setLoading, initAuth } = useAuthStore();
  const isInitialized = useRef(false);
  const hasValidUserData = useRef(false); // PERFORMANCE: Track if we have valid user data

  useEffect(() => {
    // Initialize auth from localStorage first (for immediate state restoration)
    if (!isInitialized.current) {
      initAuth();
      isInitialized.current = true;

      // Check if we have valid cached user data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          JSON.parse(cachedUser); // Validate cached data
          hasValidUserData.current = true;
        } catch {
          hasValidUserData.current = false;
        }
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // PERFORMANCE: Don't force refresh on every auth state change
          const token = await firebaseUser.getIdToken(false);

          logger.info('Firebase auth state changed - user authenticated', {
            uid: firebaseUser.uid.substring(0, 8) + '...',
            hasToken: !!token,
          });

          // SECURITY: Get user data from secure cache (non-sensitive metadata only)
          // Fallback to old 'user' key for migration
          const cachedUserStr = localStorage.getItem('userCache') || localStorage.getItem('user');

          if (cachedUserStr && hasValidUserData.current) {
            try {
              const user = JSON.parse(cachedUserStr);
              setAuth({
                user,
                accessToken: token,
                refreshToken: token,
              });
              // Log auth event with hashed identifiers (no plaintext PII)
              logger.info(
                'Firebase auth restored from cache',
                createSafeLogIdentifier(firebaseUser.uid, firebaseUser.email)
              );

              // Clean up old insecure cache if found
              if (localStorage.getItem('user')) {
                localStorage.removeItem('user');
              }
            } catch (error) {
              logger.error('Error parsing cached user', error);
              hasValidUserData.current = false;
              // If cached data is corrupted, fetch fresh data from backend
              await fetchUserDataFromBackend(token);
            }
          } else if (!hasValidUserData.current) {
            // PERFORMANCE: Only fetch if we don't have valid cached data
            logger.info('No valid cached user data - fetching from backend');
            await fetchUserDataFromBackend(token);
            hasValidUserData.current = true;
          }
        } catch (error) {
          logger.error('Error getting Firebase token', error);
          // Only logout if we can't get a fresh token
          logout();
        }
      } else {
        // User signed out - clear session
        logger.info('Firebase auth state changed - user signed out');
        hasValidUserData.current = false;
        logout();
      }

      // CRITICAL: Set loading false AFTER all auth operations complete
      setLoading(false);
    });

    // Helper function to fetch user data from backend
    async function fetchUserDataFromBackend(token: string) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const result = await response.json();
        const user = result.data;

        setAuth({
          user,
          accessToken: token,
          refreshToken: token,
        });

        logger.info('User data fetched from backend successfully');
      } catch (error) {
        logger.error('Failed to fetch user data from backend', error);
        // Only logout if we can't fetch user data
        logout();
      }
    }

    // Set up token refresh interval (refresh every 50 minutes, tokens expire after 1 hour)
    const tokenRefreshInterval = setInterval(
      async () => {
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken(true); // Force refresh
            const cachedUserStr = localStorage.getItem('userCache') || localStorage.getItem('user');

            if (cachedUserStr) {
              try {
                const user = JSON.parse(cachedUserStr);
                setAuth({
                  user,
                  accessToken: token,
                  refreshToken: token,
                });
                logger.info('Token refreshed successfully - tokens remain in memory only');

                // Clean up old insecure cache if found
                if (localStorage.getItem('user')) {
                  localStorage.removeItem('user');
                }
              } catch (parseError) {
                logger.error(
                  'Failed to parse cached user data during token refresh - clearing corrupted data',
                  parseError
                );
                localStorage.removeItem('userCache');
                localStorage.removeItem('user');
                // Continue with token refresh interval - will fetch fresh data on next auth state change
              }
            }
          } catch (error) {
            logger.error('Failed to refresh token', error);
            logout();
          }
        }
      },
      50 * 60 * 1000
    ); // 50 minutes

    // Cleanup subscription and interval on unmount
    return () => {
      unsubscribe();
      clearInterval(tokenRefreshInterval);
    };
  }, [setAuth, logout, setLoading, initAuth]);

  return <>{children}</>;
}
