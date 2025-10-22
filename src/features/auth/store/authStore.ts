// Authentication store using Zustand for Patrick Travel Services

import { create } from 'zustand';
import { User, AuthResponse } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: AuthResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (data: AuthResponse) => {
    // SECURITY: Store only non-sensitive user metadata in localStorage
    // Tokens are kept in-memory only and retrieved on-demand from Firebase
    if (typeof window !== 'undefined') {
      // Only cache non-sensitive user data needed for UI
      const safeUserCache = {
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        isVerified: data.user.isVerified,
        isActive: data.user.isActive,
        // Intentionally omit: email, phone (PII), tokens (security risk)
      };
      localStorage.setItem('userCache', JSON.stringify(safeUserCache));
      localStorage.setItem('authTimestamp', Date.now().toString());

      // Remove old insecure storage if it exists (migration)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }

    // Tokens stay in memory only - never persisted to localStorage
    set({
      user: data.user,
      accessToken: data.accessToken, // ✅ In-memory only
      refreshToken: data.refreshToken, // ✅ In-memory only
      isAuthenticated: true,
      isLoading: false,
    });

    logger.info('Auth state updated - tokens in memory only', { userId: data.user.id });
  },

  setUser: (user: User) => {
    // SECURITY: Only cache non-sensitive user metadata
    if (typeof window !== 'undefined') {
      const safeUserCache = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      };
      localStorage.setItem('userCache', JSON.stringify(safeUserCache));

      // Remove old insecure storage if it exists
      localStorage.removeItem('user');
    }
    set({ user });
  },

  logout: () => {
    // Clear all auth-related data from localStorage
    if (typeof window !== 'undefined') {
      // Remove secure cache
      localStorage.removeItem('userCache');
      localStorage.removeItem('authTimestamp');

      // Clean up old insecure storage if it exists (migration)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    logger.info('User logged out - all auth data cleared');
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  initAuth: () => {
    // Initialize auth state from secure cache
    // Firebase will handle the actual session restoration
    if (typeof window !== 'undefined') {
      const userCacheStr = localStorage.getItem('userCache');
      const authTimestamp = localStorage.getItem('authTimestamp');

      // Clean up old insecure storage if it exists (migration)
      if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
        logger.warn('Found old insecure token storage - cleaning up');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      if (userCacheStr && authTimestamp) {
        try {
          const userCache = JSON.parse(userCacheStr);

          // Check if cache is still valid (within 7 days)
          const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
          const timestamp = parseInt(authTimestamp, 10);
          const isExpired =
            !timestamp || isNaN(timestamp) || Date.now() - timestamp > SESSION_TIMEOUT;

          if (isExpired) {
            logger.warn('Session cache expired, clearing');
            localStorage.removeItem('userCache');
            localStorage.removeItem('authTimestamp');
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // Set partial user data from cache for immediate UI
            // Firebase will provide full user data and tokens when ready
            // CRITICAL: Keep isLoading TRUE until Firebase confirms with real tokens
            set({
              user: userCache as User,
              accessToken: null, // Will be set by Firebase
              refreshToken: null, // Will be set by Firebase
              isAuthenticated: false, // NOT authenticated until Firebase confirms
              isLoading: true, // Still loading until Firebase confirms
            });
            logger.info('User cache restored - waiting for Firebase session', {
              userId: userCache.id,
            });
          }
        } catch (error) {
          logger.error('Error parsing user cache from localStorage', error);
          localStorage.removeItem('userCache');
          set({ isLoading: false });
        }
      } else {
        // No cached data - keep loading true until Firebase auth state is determined
        set({ isLoading: true });
      }
    }
  },
}));
