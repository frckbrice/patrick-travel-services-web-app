// React Query hooks for FAQ operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FAQsResponse {
  faqs: FAQ[];
  faqsByCategory: Record<string, FAQ[]>;
  categories: string[];
  total: number;
}

export interface CreateFAQInput {
  question: string;
  answer: string;
  category: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFAQInput extends Partial<CreateFAQInput> {
  id: string;
}

// ============================================
// QUERIES
// ============================================

/**
 * Fetch all active FAQs (public - no auth required)
 * Cached for 1 hour for performance
 */
export const useFAQs = (options?: {
  category?: string;
  includeInactive?: boolean;
  enabled?: boolean;
}) => {
  const { category, includeInactive = false, enabled = true } = options || {};

  return useQuery({
    queryKey: ['faqs', { category, includeInactive }],
    queryFn: async (): Promise<FAQsResponse> => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (includeInactive) params.append('includeInactive', 'true');

      const response = await apiClient.get(`/api/faq?${params.toString()}`);
      return response.data.data;
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour - FAQs don't change often
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
};

// ============================================
// MUTATIONS (Admin only)
// ============================================

/**
 * Create a new FAQ (admin only)
 */
export const useCreateFAQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFAQInput): Promise<FAQ> => {
      const response = await apiClient.post('/api/faq', data);
      return response.data.data.faq;
    },
    onSuccess: () => {
      // Invalidate all FAQ queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create FAQ';
      toast.error(message);
      logger.error('FAQ creation failed', { error: message });
    },
  });
};

/**
 * Update an existing FAQ (admin only)
 */
export const useUpdateFAQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateFAQInput): Promise<FAQ> => {
      const response = await apiClient.put(`/api/faq/${id}`, data);
      return response.data.data.faq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update FAQ';
      toast.error(message);
      logger.error('FAQ update failed', { error: message });
    },
  });
};

/**
 * Delete an FAQ (admin only)
 */
export const useDeleteFAQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/faq/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete FAQ';
      toast.error(message);
      logger.error('FAQ deletion failed', { error: message });
    },
  });
};
