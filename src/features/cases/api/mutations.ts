// React Query - Mutations for Cases feature

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import type {
  Case,
  Appointment,
  CreateAppointmentInput,
  CreateCaseInput,
  UpdateCaseInput,
} from '../types';
import { CASES_KEY } from './queries';

// Create case mutation
export function useCreateCase() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCaseInput) => {
      const response = await apiClient.post('/api/cases', data);
      return response.data.data.case as Case;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      toast.success(t('cases.mutations.created'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.createFailed'));
    },
  });
}

// Update case mutation
export function useUpdateCase(id: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCaseInput) => {
      const response = await apiClient.put(`/api/cases/${id}`, data);
      return response.data.data.case as Case;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
      toast.success(t('cases.mutations.updated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.updateFailed'));
    },
  });
}

// Delete case mutation
export function useDeleteCase() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      toast.success(t('cases.mutations.deleted'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.deleteFailed'));
    },
  });
}

// Update case status (AGENT/ADMIN only)
export function useUpdateCaseStatus(id: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      const response = await apiClient.patch(`/api/cases/${id}/status`, { status, note });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
      toast.success(t('cases.mutations.statusUpdated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.statusUpdateFailed'));
    },
  });
}
// Add internal note to case (AGENT/ADMIN only)
export function useAddInternalNote(id: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      const response = await apiClient.patch(`/api/cases/${id}/notes`, { note });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, id] });
      toast.success(t('cases.mutations.noteSaved'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.noteSaveFailed'));
    },
  });
}

// Update case priority (AGENT/ADMIN only)
export function useUpdateCasePriority() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const response = await apiClient.patch(`/api/cases/${id}/priority`, { priority });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, variables.id] });
      toast.success(t('cases.mutations.priorityUpdated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.priorityUpdateFailed'));
    },
  });
}

// Assign case to agent (ADMIN only)
export function useAssignCase() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, agentId }: { caseId: string; agentId: string }) => {
      const response = await apiClient.patch(`/api/cases/${caseId}/assign`, { agentId });
      return response.data.data.case as Case;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, data.id] });
      toast.success(t('cases.mutations.assigned'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.assignFailed'));
    },
  });
}

// Transfer case to another agent (ADMIN only)
export function useTransferCase() {
  const { t } = useTranslation();
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
      toast.success(t('cases.mutations.transferred'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('cases.mutations.transferFailed'));
    },
  });
}

export function useCreateAppointment(caseId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentInput) => {
      const response = await apiClient.post(`/api/cases/${caseId}/appointments`, data);
      return response.data.data.appointment as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, caseId] });
      toast.success(t('cases.mutations.appointmentScheduled'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to schedule appointment');
    },
  });
}

// Bulk operations on cases (ADMIN ONLY - Agents cannot perform bulk operations)
export function useBulkCaseOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      operation: 'ASSIGN' | 'UPDATE_STATUS' | 'UPDATE_PRIORITY' | 'UNASSIGN';
      caseIds: string[];
      data?: {
        assignedAgentId?: string;
        status?: string;
        priority?: string;
      };
    }) => {
      const response = await apiClient.post('/api/cases/bulk', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      toast.success(data.message || 'Bulk operation completed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to perform bulk operation');
    },
  });
}

// Export cases to CSV/XLSX
export function useExportCases() {
  return useMutation({
    mutationFn: async (filters: {
      format: 'csv' | 'xlsx';
      status?: string;
      serviceType?: string;
      assignedAgentId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await apiClient.get(`/api/cases/export?${params}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `cases-export-${new Date().toISOString().split('T')[0]}.${filters.format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    },
    onSuccess: () => {
      toast.success('Cases exported successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export cases');
    },
  });
}
