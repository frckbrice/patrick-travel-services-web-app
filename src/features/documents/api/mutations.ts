// React Query - Mutations for Documents feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { Document, CreateDocumentInput } from '../types';
import { DOCUMENTS_KEY } from './queries';

// Create document metadata
export function useCreateDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentInput) => {
      const response = await apiClient.post('/api/documents', data);
      return response.data.data.document as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
      toast.success(t('documents.mutations.saved'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('documents.mutations.saveFailed'));
    },
  });
}

// Delete document
export function useDeleteDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
      toast.success(t('documents.mutations.deleted'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('documents.mutations.deleteFailed'));
    },
  });
}

// Approve document (AGENT/ADMIN only)
export function useApproveDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/api/documents/${id}/approve`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
      toast.success(t('documents.mutations.approved'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('documents.mutations.approveFailed'));
    },
  });
}

// Reject document (AGENT/ADMIN only)
export function useRejectDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.patch(`/api/documents/${id}/reject`, { reason });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
      toast.success(t('documents.mutations.rejected'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('documents.mutations.rejectFailed'));
    },
  });
}
