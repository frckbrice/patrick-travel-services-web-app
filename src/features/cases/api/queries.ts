// React Query - Queries for Cases feature

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { Case } from '../types';

export const CASES_KEY = 'cases';

// Get all cases
export function useCases(
  filters?: { status?: string; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
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
    staleTime: 60 * 1000, // PERFORMANCE: 60 seconds cache for better mobile performance
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // PERFORMANCE: Disable refetch on window focus
    refetchOnMount: false, // PERFORMANCE: Use cached data on mount
    ...options,
  });
}

// Get single case
export function useCase(id: string) {
  return useQuery({
    queryKey: [CASES_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/cases/${id}`);
      return response.data.data as Case;
    },
    enabled: !!id,
  });
}
