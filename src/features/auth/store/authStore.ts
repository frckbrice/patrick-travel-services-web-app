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
        // Save tokens to localStorage with timestamp
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('authTimestamp', Date.now().toString());
        }

        set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
        });

        logger.info('Auth state updated', { userId: data.user.id });
    },

    setUser: (user: User) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user });
    },

    logout: () => {
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('authTimestamp');
        }

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
        });

        logger.info('User logged out');
    },

    setLoading: (isLoading: boolean) => {
        set({ isLoading });
    },

    initAuth: () => {
        // Initialize auth state from localStorage
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const userStr = localStorage.getItem('user');
            const authTimestamp = localStorage.getItem('authTimestamp');

            if (accessToken && refreshToken && userStr) {
                try {
                    const user = JSON.parse(userStr) as User;

                    // Check if session is still valid (within 7 days)
                    const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
                    const timestamp = authTimestamp ? parseInt(authTimestamp, 10) : 0;
                    const isExpired = !timestamp || isNaN(timestamp) || Date.now() - timestamp > SESSION_TIMEOUT;

                    if (isExpired) {
                        logger.warn('Session expired, clearing auth state');
                        // Clear expired session
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        localStorage.removeItem('authTimestamp');
                        set({ isLoading: false });
                    } else {
                        set({
                            user,
                            accessToken,
                            refreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                        logger.info('Auth state restored from localStorage', { userId: user.id });
                    }
                } catch (error) {
                    logger.error('Error parsing user from localStorage', error);
                    set({ isLoading: false });
                }
            } else {
                set({ isLoading: false });
            }
        }
    },
}));

