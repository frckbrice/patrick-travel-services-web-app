// Hook to get unread received emails count
// Used for sidebar badge display

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { apiClient } from '@/lib/utils/axios';
import { isAuthenticated } from '@/lib/auth/token-manager';

export function useUnreadReceivedEmails() {
  const {
    user,
    isLoading: isAuthLoading,
    isAuthenticated: isAuthStoreAuthenticated,
  } = useAuthStore();

  // Check if user is authenticated (both store and Firebase)
  const isUserAuthenticated = isAuthStoreAuthenticated && isAuthenticated();
  const isAgentOrAdmin = user?.role === 'AGENT' || user?.role === 'ADMIN';

  return useQuery({
    queryKey: ['unread-received-emails-count', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/api/emails?direction=incoming&isRead=false&limit=1');
      const total = response.data.data.pagination.total;
      return total;
    },
    enabled: !isAuthLoading && !!user?.id && isUserAuthenticated && isAgentOrAdmin,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors (authentication issues)
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}
