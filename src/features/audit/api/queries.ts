// React Query hooks for Activity Logs / Audit Logs

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { ROUTES } from '@/lib/constants';
import { ActivityLogsResponse, ActivityLogsFilters } from './types';

export const ACTIVITY_LOGS_KEY = 'activityLogs';

/**
 * Hook to fetch activity logs with filtering and pagination
 * Uses apiClient for automatic authentication and token refresh
 */
export function useActivityLogs(
  filters: ActivityLogsFilters = {},
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
  }
): UseQueryResult<ActivityLogsResponse, Error> {
  return useQuery({
    queryKey: [ACTIVITY_LOGS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `${ROUTES.API.ADMIN.ACTIVITY_LOGS}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get(url);
      return response.data.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: options?.staleTime ?? 30000, // 30 seconds
    gcTime: options?.gcTime ?? 300000, // 5 minutes
    refetchOnMount: options?.refetchOnMount ?? false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    retry: false, // Don't retry on error
  });
}

/**
 * Generate export URL for activity logs with current authentication
 * Note: This will trigger a download via window.open with auto-auth from apiClient
 */
export async function exportActivityLogs(filters: ActivityLogsFilters = {}): Promise<void> {
  const params = new URLSearchParams();

  if (filters.action) params.append('action', filters.action);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  const url = `${ROUTES.API.ADMIN.ACTIVITY_LOGS_EXPORT}${queryString ? `?${queryString}` : ''}`;

  // Use apiClient to handle authentication
  const response = await apiClient.get(url, {
    responseType: 'blob', // Important for file downloads
  });

  // Create a download link
  const blob = new Blob([response.data], { type: 'text/csv' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `activity-logs-${new Date().toISOString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
