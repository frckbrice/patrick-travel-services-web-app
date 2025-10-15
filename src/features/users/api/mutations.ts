// React Query - Mutations for Users feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { User, UpdateUserInput } from '../types';
import { USERS_KEY } from './queries';

// Update user
export function useUpdateUser(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateUserInput) => {
            const response = await apiClient.put(`/api/users/${id}`, data);
            return response.data.data.user as User;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
            queryClient.invalidateQueries({ queryKey: [USERS_KEY, id] });
            toast.success('User updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update user');
        },
    });
}

// Deactivate user
export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
            toast.success('User deactivated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to deactivate user');
        },
    });
}
