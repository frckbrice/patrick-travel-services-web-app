import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase/firebase-client';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

// Fetch user settings
export const useUserSettings = () => {
  return useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/api/users/settings');
      return response.data.data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update user settings
export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await apiClient.patch('/api/users/settings', settings);
      return response.data.data.settings;
    },
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-settings'] });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(['user-settings']);

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(['user-settings'], {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onError: (error, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['user-settings'], context.previousSettings);
      }

      logger.error('Failed to update settings', { error });
      toast.error('Failed to update settings. Please try again.');
    },
    onSuccess: () => {
      logger.info('Settings updated successfully');
      toast.success('Settings updated successfully');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};

// Change user password using Firebase Auth
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: PasswordChangeInput) => {
      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user with current password (required for sensitive operations)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      try {
        await reauthenticateWithCredential(user, credential);
      } catch (error: any) {
        // Handle Firebase reauthentication errors
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          throw new Error('Current password is incorrect');
        } else if (error.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later');
        }
        throw new Error('Failed to verify current password');
      }

      // Update password
      try {
        await updatePassword(user, newPassword);
      } catch (error: any) {
        if (error.code === 'auth/weak-password') {
          throw new Error('New password is too weak');
        } else if (error.code === 'auth/requires-recent-login') {
          throw new Error('Please log out and log in again to change your password');
        }
        throw new Error('Failed to update password');
      }

      return { success: true };
    },
    onSuccess: () => {
      logger.info('Password changed successfully');
      toast.success('Password updated successfully!');
    },
    onError: (error: Error) => {
      logger.error('Password change failed', { error: error.message });
      toast.error(error.message || 'Failed to update password. Please try again.');
    },
  });
};
