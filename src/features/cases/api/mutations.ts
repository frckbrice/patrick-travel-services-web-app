// React Query - Mutations for Cases feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type { Case, CreateCaseInput, UpdateCaseInput } from '../types';
import { CASES_KEY } from './queries';

// Create case mutation
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCaseInput) => {
      const response = await apiClient.post('/api/cases', data);
      return response.data.data.case as Case;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      toast.success('Case created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create case');
    },
  });
}

// Update case mutation
export function useUpdateCase(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCaseInput) => {
      const response = await apiClient.put(`/api/cases/${id}`, data);
      return response.data.data.case as Case;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
      toast.success('Case updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update case');
    },
  });
}

// Delete case mutation
export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      toast.success('Case deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete case');
    },
  });
}

// Update case status (AGENT/ADMIN only)
export function useUpdateCaseStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      const response = await apiClient.patch(`/api/cases/${id}/status`, { status, note });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
      toast.success('Case status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });
}
// Add internal note to case (AGENT/ADMIN only)
export function useAddInternalNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      const response = await apiClient.patch(`/api/cases/${id}/notes`, { note });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
      toast.success('Internal note saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save note');
    },
  });
}

// Update case priority (AGENT/ADMIN only)
export function useUpdateCasePriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const response = await apiClient.patch(`/api/cases/${id}/priority`, { priority });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, variables.id] });
      toast.success('Priority updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update priority');
    },
  });
}

// Assign case to agent (ADMIN only)
export function useAssignCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, agentId }: { caseId: string; agentId: string }) => {
      const response = await apiClient.patch(`/api/cases/${caseId}/assign`, { agentId });
      return response.data.data.case as Case;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, data.id] });
      toast.success('Case assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign case');
    },
  });
}

// Transfer case to another agent (ADMIN only)
export function useTransferCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      caseId: string;
      newAgentId: string;
      reason: string;
      handoverNotes?: string;
      notifyClient: boolean;
      notifyAgent: boolean;
    }) => {
      const response = await apiClient.post(`/api/cases/${data.caseId}/transfer`, {
        newAgentId: data.newAgentId,
        reason: data.reason,
        handoverNotes: data.handoverNotes,
        notifyClient: data.notifyClient,
        notifyAgent: data.notifyAgent,
      });
      return response.data.data.case as Case;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, data.id] });
      toast.success('Case transferred successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to transfer case');
    },
  });
}
