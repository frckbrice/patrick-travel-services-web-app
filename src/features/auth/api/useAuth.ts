// React Query hooks for Firebase authentication

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
  getAdditionalUserInfo,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { apiClient } from '@/lib/utils/axios';
import { useAuthStore } from '../store';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

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

// Register mutation - SECURE: Firebase user created server-side
export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterInput): Promise<{ user: User; token: string }> => {
      // Ensure persistence is set before registration
      await setPersistence(auth, browserLocalPersistence);

      // SECURITY: Send password to backend - server creates Firebase user
      // This prevents client-created users and ensures validation happens first
      const response = await apiClient.post('/api/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        inviteCode: data.inviteCode,
      });

      const { user, customToken } = response.data.data;

      // Sign in with custom token provided by backend
      // Backend has already created the Firebase user and set custom claims
      const userCredential = await signInWithCustomToken(auth, customToken);

      // Get Firebase ID token for subsequent requests
      const token = await userCredential.user.getIdToken();

      return {
        user,
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

      // Delay redirect to show success state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    },
    onError: (error: ApiError) => {
      // Handle errors from backend
      let message = 'Registration failed. Please try again.';

      // Backend validation errors
      if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
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
      // Ensure persistence is set before signing in
      await setPersistence(auth, browserLocalPersistence);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);

      // Get Firebase ID token (will be sent in Authorization header)
      const token = await userCredential.user.getIdToken();

      // Sync with backend (update last login, get user data)
      // The backend will refresh custom claims on this call
      // firebaseUid is extracted from token on server
      const response = await apiClient.post(
        '/api/auth/login',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // CRITICAL: Force token refresh to pick up updated custom claims from backend
      // Without this, the client will use the old token without the refreshed role claims
      // forceRefresh=true bypasses cache and gets a new token with updated claims
      const refreshedToken = await userCredential.user.getIdToken(true);

      logger.info('Token refreshed after custom claims update');

      return {
        user: response.data.data.user,
        token: refreshedToken, // Use refreshed token with updated claims
      };
    },
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.token,
        refreshToken: data.token,
      });
      toast.success(`Welcome back, ${data.user.firstName}!`);

      // Delay redirect to show success state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
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
        logger.error('Backend logout error:', error);
      }
    },
    onSuccess: () => {
      logout();
      queryClient.clear(); // Clear all queries
      toast.success('Logged out successfully');
      router.replace('/');
    },
    onError: () => {
      // Even if logout fails, clear local state
      logout();
      queryClient.clear();
      router.replace('/');
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
    logger.error('Error getting Firebase token:', error);
    return null;
  }
};

// Google Sign-In mutation
export const useGoogleSignIn = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<{ user: User; token: string; isNewUser: boolean }> => {
      // Ensure persistence is set before Google sign-in
      await setPersistence(auth, browserLocalPersistence);

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
      const additionalUserInfo = getAdditionalUserInfo(userCredential);
      const isNewUser = additionalUserInfo?.isNewUser ?? false;

      // Sync with backend (firebaseUid is extracted from token on server)
      // The backend will set/refresh custom claims on this call
      const response = await apiClient.post(
        '/api/auth/google',
        {
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

      // CRITICAL: Force token refresh to pick up custom claims set by backend
      // forceRefresh=true bypasses cache and gets a new token with claims
      const refreshedToken = await firebaseUser.getIdToken(true);

      logger.info('Token refreshed after Google sign-in custom claims update');

      return {
        user: response.data.data.user,
        token: refreshedToken, // Use refreshed token with updated claims
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

      // Delay redirect to show success state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
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
