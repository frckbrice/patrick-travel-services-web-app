'use client';

// Firebase Auth state listener provider

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { useAuthStore } from '@/features/auth/store';
import { logger } from '@/lib/utils/logger';

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
    const { setAuth, logout, setLoading } = useAuthStore();

    useEffect(() => {
        setLoading(true);

        // Listen to Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // User is signed in
                    const token = await firebaseUser.getIdToken();

                    // Get user data from localStorage first (for immediate UI update)
                    const cachedUser = localStorage.getItem('user');

                    if (cachedUser) {
                        try {
                            const user = JSON.parse(cachedUser);
                            setAuth({
                                user,
                                accessToken: token,
                                refreshToken: token,
                            });
                        } catch (error) {
                            logger.error('Error parsing cached user', error);
                        }
                    }

                    logger.info('Firebase auth state changed - user authenticated', {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                    });
                } catch (error) {
                    logger.error('Error getting Firebase token', error);
                    logout();
                }
            } else {
                // User is signed out
                logger.info('Firebase auth state changed - user signed out');
                logout();
            }

            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [setAuth, logout, setLoading]);

    return <>{children}</>;
}

