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
    onMutate: async (newFAQ) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['faqs'] });

      // Snapshot the previous value
      const previousFAQs = queryClient.getQueryData(['faqs']);

      // Optimistically update with temporary FAQ
      const tempFAQ: FAQ = {
        id: `temp-${Date.now()}`, // Temporary ID
        question: newFAQ.question,
        answer: newFAQ.answer,
        category: newFAQ.category,
        order: newFAQ.order || 0,
        isActive: newFAQ.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['faqs'], (old: any) => {
        if (!old) return { faqs: [tempFAQ], categories: [newFAQ.category] };
        return {
          ...old,
          faqs: [tempFAQ, ...old.faqs],
          categories: old.categories.includes(newFAQ.category)
            ? old.categories
            : [...old.categories, newFAQ.category],
        };
      });

      return { previousFAQs };
    },
    onSuccess: (data) => {
      // Replace temporary FAQ with real one
      queryClient.setQueryData(['faqs'], (old: any) => {
        if (!old) return { faqs: [data], categories: [data.category] };
        return {
          ...old,
          faqs: old.faqs.map((faq: FAQ) => (faq.id.startsWith('temp-') ? data : faq)),
        };
      });

      toast.success('FAQ created successfully');
    },
    onError: (error: any, newFAQ, context) => {
      // Revert optimistic update on error
      if (context?.previousFAQs) {
        queryClient.setQueryData(['faqs'], context.previousFAQs);
      }
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
    onMutate: async ({ id, ...data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['faqs'] });

      // Snapshot the previous value
      const previousFAQs = queryClient.getQueryData(['faqs']);

      // Optimistically update the FAQ
      queryClient.setQueryData(['faqs'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          faqs: old.faqs.map((faq: FAQ) =>
            faq.id === id ? { ...faq, ...data, updatedAt: new Date().toISOString() } : faq
          ),
          categories: old.categories.includes(data.category)
            ? old.categories
            : [...old.categories, data.category],
        };
      });

      return { previousFAQs };
    },
    onSuccess: (data) => {
      // Update with the real data from server
      queryClient.setQueryData(['faqs'], (old: any) => {
        if (!old) return { faqs: [data], categories: [data.category] };
        return {
          ...old,
          faqs: old.faqs.map((faq: FAQ) => (faq.id === data.id ? data : faq)),
        };
      });

      toast.success('FAQ updated successfully');
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousFAQs) {
        queryClient.setQueryData(['faqs'], context.previousFAQs);
      }
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
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['faqs'] });

      // Snapshot the previous value
      const previousFAQs = queryClient.getQueryData(['faqs']);

      // Optimistically remove the FAQ
      queryClient.setQueryData(['faqs'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          faqs: old.faqs.filter((faq: FAQ) => faq.id !== id),
        };
      });

      return { previousFAQs };
    },
    onSuccess: () => {
      toast.success('FAQ deleted successfully');
    },
    onError: (error: any, id, context) => {
      // Revert optimistic update on error
      if (context?.previousFAQs) {
        queryClient.setQueryData(['faqs'], context.previousFAQs);
      }
      const message = error.response?.data?.error || 'Failed to delete FAQ';
      toast.error(message);
      logger.error('FAQ deletion failed', { error: message });
    },
  });
};
