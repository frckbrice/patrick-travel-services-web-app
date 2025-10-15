// React Query - Mutations for Cases feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { Case, CreateCaseInput, UpdateCaseInput } from '../types';
import { CASES_KEY } from './queries';

// Create case mutation
export function useCreateCase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateCaseInput) => {
            const response = await apiClient.post('/api/cases', data);
            return response.data.data.case as Case;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
            toast.success('Case created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create case');
        },
    });
}

// Update case mutation
export function useUpdateCase(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateCaseInput) => {
            const response = await apiClient.put(`/api/cases/${id}`, data);
            return response.data.data.case as Case;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
            queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
            toast.success('Case updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update case');
        },
    });
}

// Delete case mutation
export function useDeleteCase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/cases/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
            toast.success('Case deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete case');
        },
    });
}

