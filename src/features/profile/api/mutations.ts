// React Query - Mutations for Profile feature

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { User } from '@/lib/types';
import { useAuthStore } from '@/features/auth/store';

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
}

// Update current user profile
export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await apiClient.patch('/api/users/profile', data);
      return response.data.data.user as User;
    },
    onSuccess: (updatedUser) => {
      // Update the auth store with the new user data
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });
}

// Upload avatar (profile picture)
export function useUploadAvatar() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (file: File) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (4MB max)
      const maxSize = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 4MB');
      }

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const response = await apiClient.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.user as User;
    },
    onSuccess: (updatedUser) => {
      // Update the auth store with the new user data
      setUser(updatedUser);
      toast.success('Avatar updated successfully');
    },
    onError: (error: any) => {
      const errorMessage =
        error.message || error.response?.data?.error || 'Failed to upload avatar';
      toast.error(errorMessage);
    },
  });
}
