// React Query - Queries for Users feature

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { User } from '../types';

export const USERS_KEY = 'users';

// Get all users (ADMIN/AGENT only)
export function useUsers(filters?: { role?: string; search?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: [USERS_KEY, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.role) params.append('role', filters.role);
            if (filters?.search) params.append('search', filters.search);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());

            const response = await apiClient.get(`/api/users?${params}`);
            return response.data.data;
        },
        staleTime: 60 * 1000, // 1 minute
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
