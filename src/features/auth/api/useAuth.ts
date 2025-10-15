// React Query hooks for Firebase authentication

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { apiClient } from '@/lib/utils/axios';
import { useAuthStore } from '../store';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { toast } from 'sonner';

// API Error Type
interface ApiError {
    response?: {
        data?: {
            error?: string;
            message?: string;
        };
    };
    message?: string;
    code?: string;
}

// Register mutation
export const useRegister = () => {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: RegisterInput): Promise<{ user: User; token: string }> => {
            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // Register user in backend database
            const response = await apiClient.post('/api/auth/register', {
                ...data,
                firebaseUid: userCredential.user.uid,
            });

            // Get Firebase ID token
            const token = await userCredential.user.getIdToken();

            return {
                user: response.data.data.user,
                token,
            };
        },
        onSuccess: async (data) => {
            setAuth({
                user: data.user,
                accessToken: data.token,
                refreshToken: data.token, // Firebase uses the same token
            });
            toast.success('Registration successful! Welcome to Patrick Travel Services.');
            router.push('/dashboard');
        },
        onError: (error: ApiError) => {
            // Handle Firebase errors
            const firebaseError = error.code;
            let message = 'Registration failed. Please try again.';

            if (firebaseError === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            } else if (firebaseError === 'auth/weak-password') {
                message = 'Password is too weak. Please use a stronger password.';
            } else if (firebaseError === 'auth/invalid-email') {
                message = 'Invalid email address.';
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            }

            toast.error(message);
        },
    });
};

// Login mutation
export const useLogin = () => {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: LoginInput): Promise<{ user: User; token: string }> => {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // Get Firebase ID token
            const token = await userCredential.user.getIdToken();

            // Sync with backend (update last login, get user data)
            const response = await apiClient.post(
                '/api/auth/login',
                { firebaseUid: userCredential.user.uid },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return {
                user: response.data.data.user,
                token,
            };
        },
        onSuccess: (data) => {
            setAuth({
                user: data.user,
                accessToken: data.token,
                refreshToken: data.token,
            });
            toast.success(`Welcome back, ${data.user.firstName}!`);

            // Redirect based on role
            if (data.user.role === 'CLIENT') {
                router.push('/dashboard');
            } else {
                router.push('/dashboard');
            }
        },
        onError: (error: ApiError) => {
            // Handle Firebase errors
            const firebaseError = error.code;
            let message = 'Login failed. Please check your credentials.';

            if (firebaseError === 'auth/user-not-found' || firebaseError === 'auth/wrong-password') {
                message = 'Invalid email or password.';
            } else if (firebaseError === 'auth/too-many-requests') {
                message = 'Too many failed login attempts. Please try again later.';
            } else if (firebaseError === 'auth/user-disabled') {
                message = 'This account has been disabled.';
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            }

            toast.error(message);
        },
    });
};

// Logout mutation
export const useLogout = () => {
    const { logout } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // Sign out from Firebase
            await signOut(auth);

            // Optionally call backend to revoke tokens
            try {
                await apiClient.post('/api/auth/logout');
            } catch (error) {
                // Ignore backend errors during logout
                console.error('Backend logout error:', error);
            }
        },
        onSuccess: () => {
            logout();
            queryClient.clear(); // Clear all queries
            toast.success('Logged out successfully');
            router.push('/');
        },
        onError: () => {
            // Even if logout fails, clear local state
            logout();
            queryClient.clear();
            router.push('/');
        },
    });
};

// Get current user query
export const useCurrentUser = () => {
    const { isAuthenticated, user } = useAuthStore();

    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async (): Promise<User> => {
            // Get current Firebase user
            const firebaseUser = auth.currentUser;

            if (!firebaseUser) {
                throw new Error('No authenticated user');
            }

            // Get fresh token
            const token = await firebaseUser.getIdToken();

            // Fetch user data from backend
            const response = await apiClient.get('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data.data;
        },
        enabled: isAuthenticated && !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
};

// Hook to get current Firebase user
export const useFirebaseUser = (): FirebaseUser | null => {
    return auth.currentUser;
};

// Hook to get Firebase ID token
export const useFirebaseToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch (error) {
        console.error('Error getting Firebase token:', error);
        return null;
    }
};

// Google Sign-In mutation
export const useGoogleSignIn = () => {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: async (): Promise<{ user: User; token: string; isNewUser: boolean }> => {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account',
            });

            // Sign in with Google popup
            const userCredential = await signInWithPopup(auth, provider);
            const firebaseUser = userCredential.user;

            // Get Firebase ID token
            const token = await firebaseUser.getIdToken();

            // Check if this is a new user
            const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;

            // Sync with backend
            const response = await apiClient.post(
                '/api/auth/google',
                {
                    firebaseUid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    isNewUser,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return {
                user: response.data.data.user,
                token,
                isNewUser,
            };
        },
        onSuccess: (data) => {
            setAuth({
                user: data.user,
                accessToken: data.token,
                refreshToken: data.token,
            });
            
            if (data.isNewUser) {
                toast.success('Welcome to Patrick Travel Services!');
            } else {
                toast.success(`Welcome back, ${data.user.firstName}!`);
            }
            
            router.push('/dashboard');
        },
        onError: (error: ApiError) => {
            let message = 'Google sign-in failed. Please try again.';

            if (error.code === 'auth/popup-closed-by-user') {
                message = 'Sign-in cancelled.';
            } else if (error.code === 'auth/popup-blocked') {
                message = 'Popup was blocked. Please allow popups for this site.';
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            }

            toast.error(message);
        },
    });
};
