// React Query - Queries for Documents feature

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import type { Document } from '../types';

export const DOCUMENTS_KEY = 'documents';

// Get all documents
export function useDocuments(
  filters?: { caseId?: string; type?: string; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ documents: Document[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery<{ documents: Document[] }>({
    queryKey: [DOCUMENTS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.caseId) params.append('caseId', filters.caseId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/api/documents?${params}`);
      return response.data.data;
    },
    staleTime: 60 * 1000, // PERFORMANCE: 60 seconds cache
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // PERFORMANCE: Disable refetch on window focus
    refetchOnMount: false, // PERFORMANCE: Use cached data on mount
    ...options,
  });
}

// Get single document
export function useDocument(id: string) {
  return useQuery({
    queryKey: [DOCUMENTS_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/documents/${id}`);
      return response.data.data.document as Document;
    },
    enabled: !!id,
  });
}
