// React Query - Queries for Users feature

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { User } from '../types';

export const USERS_KEY = 'users';

// Get all users (ADMIN/AGENT only)
export function useUsers(
  filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeCaseCounts?: boolean;
  },
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    retry?: boolean | number | ((failureCount: number, error: any) => boolean);
    retryDelay?: number | ((attemptIndex: number) => number);
  }
) {
  return useQuery({
    queryKey: [USERS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.includeCaseCounts) params.append('includeCaseCounts', 'true');

      const response = await apiClient.get(`/api/users?${params}`);
      return response.data.data;
    },
    // SECURITY FIX: Respect explicit enabled flag (defaults to true for backward compatibility)
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: options?.staleTime ?? 60 * 1000, // 1 minute default
    gcTime: options?.gcTime,
    refetchOnMount: options?.refetchOnMount ?? false, // Don't refetch on mount to prevent unnecessary calls
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false, // Don't refetch on window focus to prevent unnecessary calls
    retry: options?.retry ?? false, // Don't retry by default - let the caller decide
    retryDelay: options?.retryDelay,
  });
}

// Get single user
export function useUser(id: string) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data.data.user as User;
    },
    enabled: !!id,
  });
}
