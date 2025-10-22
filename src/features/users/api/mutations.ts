// React Query - Mutations for Users feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { User, UpdateUserInput } from '../types';
import { USERS_KEY } from './queries';

// Update user (ADMIN only)
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUserInput }) => {
      const response = await apiClient.put(`/api/users/${id}`, updates);
      return response.data.data.user as User;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USERS_KEY, variables.id] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });
}

// Delete user (ADMIN only)
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });
}
