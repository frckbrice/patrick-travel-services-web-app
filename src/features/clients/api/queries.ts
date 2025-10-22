// React Query - Queries for Clients feature

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { User } from '@/features/users/types';
import type { Case } from '@/lib/types';

export const CLIENTS_KEY = 'clients';

// Get single client with their cases
export function useClient(id: string) {
  return useQuery({
    queryKey: [CLIENTS_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data.data.user as User;
    },
    enabled: !!id,
  });
}

// Get client's cases
export function useClientCases(clientId: string) {
  return useQuery({
    queryKey: ['cases', 'client', clientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/cases?clientId=${clientId}`);
      return response.data.data.cases as Case[];
    },
    enabled: !!clientId,
  });
}
