// React Query - Mutations for Documents feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { Document, CreateDocumentInput } from '../types';
import { DOCUMENTS_KEY } from './queries';

// Create document metadata
export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateDocumentInput) => {
            const response = await apiClient.post('/api/documents', data);
            return response.data.data.document as Document;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
            toast.success('Document saved successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to save document');
        },
    });
}

// Delete document
export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/documents/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
            toast.success('Document deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete document');
        },
    });
}
