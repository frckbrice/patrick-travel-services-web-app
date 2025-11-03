// React Query - Queries for Cases feature

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { Case } from '../types';

export const CASES_KEY = 'cases';

// Filter interface for cases
export interface CasesFilters {
  status?: string;
  serviceType?: string;
  assignedAgentId?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  isAssigned?: 'true' | 'false';
  page?: number;
  limit?: number;
}

// API response interface with pagination
export interface CasesApiResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all cases with comprehensive filtering
export function useCases(
  filters?: CasesFilters,
  options?: Omit<UseQueryOptions<CasesApiResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [CASES_KEY, filters],
    queryFn: async (): Promise<CasesApiResponse> => {
      const params = new URLSearchParams();

      // Add all filter parameters
      if (filters?.status) params.append('status', filters.status);
      if (filters?.serviceType) params.append('serviceType', filters.serviceType);
      if (filters?.assignedAgentId) params.append('assignedAgentId', filters.assignedAgentId);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.isAssigned) params.append('isAssigned', filters.isAssigned);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/api/cases?${params}`);
      return response.data.data as CasesApiResponse;
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
