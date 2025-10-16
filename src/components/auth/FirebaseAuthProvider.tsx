'use client';

// Firebase Auth state listener provider

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { useAuthStore } from '@/features/auth/store';
import { logger } from '@/lib/utils/logger';

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
    const { setAuth, logout, setLoading, initAuth } = useAuthStore();
    const isInitialized = useRef(false);

    useEffect(() => {
        // Initialize auth from localStorage first (for immediate state restoration)
        if (!isInitialized.current) {
            initAuth();
            isInitialized.current = true;
        }

        // Listen to Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // User is signed in - get fresh token
                    const token = await firebaseUser.getIdToken();

                    // Get user data from localStorage (for immediate UI update)
                    const cachedUser = localStorage.getItem('user');

                    if (cachedUser) {
                        try {
                            const user = JSON.parse(cachedUser);
                            setAuth({
                                user,
                                accessToken: token,
                                refreshToken: token,
                            });
                            logger.info('Firebase auth state changed - user authenticated', {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                            });
                        } catch (error) {
                            logger.error('Error parsing cached user', error);
                            logout();
                        }
                    } else {
                        logger.warn('Firebase user exists but no cached user data found - logging out');
                        logout();
                    }
                } catch (error) {
                    logger.error('Error getting Firebase token', error);
                    // Only logout if we can't get a fresh token
                    logout();
                }
            } else {
                // User signed out - clear session
                logger.info('Firebase auth state changed - user signed out');
                logout();
            }

            setLoading(false);
        });

        // Set up token refresh interval (refresh every 50 minutes, tokens expire after 1 hour)
        const tokenRefreshInterval = setInterval(async () => {
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken(true); // Force refresh
                    const cachedUser = localStorage.getItem('user');

                    if (cachedUser) {
                        const user = JSON.parse(cachedUser);
                        setAuth({
                            user,
                            accessToken: token,
                            refreshToken: token,
                        });
                        logger.info('Token refreshed successfully');
                    }
                } catch (error) {
                    logger.error('Failed to refresh token', error);
                }
            }
        }, 50 * 60 * 1000); // 50 minutes

        // Cleanup subscription and interval on unmount
        return () => {
            unsubscribe();
            clearInterval(tokenRefreshInterval);
        };
    }, [setAuth, logout, setLoading, initAuth]);

    return <>{children}</>;
}

