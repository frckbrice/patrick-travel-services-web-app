import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';

export type LegalType = 'TERMS' | 'PRIVACY';

export interface LegalDocument {
  id: string;
  type?: LegalType;
  language: string;
  title: string;
  slug: string;
  version?: string | null;
  content: string;
  isActive: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LegalListResponse {
  documents: LegalDocument[];
  total: number;
}

export interface CreateLegalInput {
  title: string;
  slug: string;
  version?: string;
  content: string;
  language: string;
  isActive?: boolean;
  publishedAt?: string | Date | null;
}

export interface UpdateLegalInput extends Partial<CreateLegalInput> {
  id: string;
}

const endpointForType = (type: LegalType) =>
  type === 'TERMS' ? '/api/legal/terms' : '/api/legal/privacy';

export const useLegalDocuments = (
  type: LegalType,
  options?: { includeInactive?: boolean; language?: string; enabled?: boolean }
) => {
  const { includeInactive = true, language, enabled = true } = options || {};
  return useQuery({
    queryKey: ['legal', type, { includeInactive, language }],
    queryFn: async (): Promise<LegalListResponse> => {
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      if (language) params.append('language', language);
      const res = await apiClient.get(`${endpointForType(type)}?${params.toString()}`);
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 60 * 1000,
  });
};

// Hook to get latest document for a specific language (for public pages)
export const useLatestLegalDocument = (
  type: LegalType,
  language: string = 'en',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['legal', type, 'latest', language],
    queryFn: async (): Promise<LegalDocument | null> => {
      const params = new URLSearchParams();
      params.append('latest', 'true');
      params.append('language', language);
      const res = await apiClient.get(`${endpointForType(type)}?${params.toString()}`);
      return res.data.data.document || null;
    },
    enabled,
    staleTime: 30 * 60 * 1000,
  });
};

export const useCreateLegal = (type: LegalType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLegalInput): Promise<LegalDocument> => {
      const res = await apiClient.post(endpointForType(type), data);
      return res.data.data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal', type] });
      toast.success('Document created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create document');
    },
  });
};

export const useUpdateLegal = (type: LegalType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateLegalInput): Promise<LegalDocument> => {
      const res = await apiClient.put(`${endpointForType(type)}/${id}`, data);
      return res.data.data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal', type] });
      toast.success('Document updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update document');
    },
  });
};

export const useDeleteLegal = (type: LegalType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`${endpointForType(type)}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal', type] });
      toast.success('Document deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete document');
    },
  });
};
