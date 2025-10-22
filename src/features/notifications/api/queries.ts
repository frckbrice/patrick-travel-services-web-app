// React Query - Queries for Notifications feature

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';

export const NOTIFICATIONS_KEY = 'notifications';

// Get notifications
export function useNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, { unreadOnly }],
    queryFn: async () => {
      const params = unreadOnly ? '?unreadOnly=true' : '';
      const response = await apiClient.get(`/api/notifications${params}`);
      return response.data.data;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}
