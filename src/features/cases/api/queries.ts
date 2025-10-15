// React Query - Queries for Cases feature

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { Case } from '../types';

export const CASES_KEY = 'cases';

// Get all cases
export function useCases(filters?: { status?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: [CASES_KEY, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());

            const response = await apiClient.get(`/api/cases?${params}`);
            return response.data.data;
        },
        staleTime: 30 * 1000, // 30 seconds
    });
}

// Get single case
export function useCase(id: string) {
    return useQuery({
        queryKey: [CASES_KEY, id],
        queryFn: async () => {
            const response = await apiClient.get(`/api/cases/${id}`);
            return response.data.data.case as Case;
        },
        enabled: !!id,
    });
}

