'use client';

import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '../api';
import type { Appointment, Case } from '../types';
import { CaseStatus } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CaseCardPlaceholder } from '@/components/ui/progressive-placeholder';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { ScheduleAppointmentDialog } from './ScheduleAppointmentDialog';
import { formatDateTime } from '@/lib/utils/helpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import { CASES_KEY } from '../api';
import type { CasesApiResponse } from '../api/queries';

const statusConfig: Record<string, { label: string; className: string }> = {
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  DOCUMENTS_REQUIRED: {
    label: 'Documents Required',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
};

const serviceLabels: Record<string, string> = {
  STUDENT_VISA: 'Student Visa',
  WORK_PERMIT: 'Work Permit',
  FAMILY_REUNIFICATION: 'Family Reunification',
  TOURIST_VISA: 'Tourist Visa',
  BUSINESS_VISA: 'Business Visa',
  PERMANENT_RESIDENCY: 'Permanent Residency',
};

export function CasesList() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Optimized for mobile performance
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [optimisticAppointments, setOptimisticAppointments] = useState<Record<string, Appointment>>(
    {}
  );
  const [optimisticClosedCases, setOptimisticClosedCases] = useState<Record<string, boolean>>({});
  const closingCaseIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useCases(
    { status: statusFilter !== 'all' ? statusFilter : undefined },
    {
      staleTime: 60000, // Cache for 60 seconds
      gcTime: 600000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Use cached data
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    }
  );

  const cases: Case[] = data?.cases || [];

  // Remove optimistic closed markers once server data reflects status
  useEffect(() => {
    setOptimisticClosedCases((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((caseId) => {
        const match = cases.find((item) => item.id === caseId);
        if (!match || match.status === CaseStatus.CLOSED) {
          delete next[caseId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [cases]);

  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  // Memoize filtered results for performance
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return cases.filter((c: Case) => {
      if (!q) return true;
      const label = (serviceLabels[c.serviceType] ?? '').toLowerCase();
      return c.referenceNumber.toLowerCase().includes(q) || label.includes(q);
    });
  }, [cases, searchQuery]);

  // PERFORMANCE: Only show skeleton on first load (no cached data)
  const isFirstLoad = isLoading && !data;
  if (isFirstLoad) return <CasesListSkeleton />;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading cases. Please try again.</p>
      </div>
    );

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCases = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleManageAppointment = useCallback((caseItem: Case) => {
    setSelectedCase(caseItem);
    setAppointmentDialogOpen(true);
  }, []);

  const handleAppointmentDialogChange = useCallback((open: boolean) => {
    setAppointmentDialogOpen(open);
    if (!open) {
      setSelectedCase(null);
    }
  }, []);

  const handleAppointmentScheduled = useCallback((appointment: Appointment, caseId: string) => {
    setOptimisticAppointments((prev) => ({
      ...prev,
      [caseId]: appointment,
    }));
    setOptimisticClosedCases((prev) => {
      if (!prev[caseId]) return prev;
      const next = { ...prev };
      delete next[caseId];
      return next;
    });
  }, []);

  type UpdateStatusVariables = { caseId: string; status: CaseStatus };
  type UpdateStatusContext = {
    previousQueries: Array<[unknown, CasesApiResponse | undefined]>;
  };

  const updateCaseStatusMutation = useMutation<
    any,
    any,
    UpdateStatusVariables,
    UpdateStatusContext
  >({
    mutationFn: async ({ caseId, status }) => {
      const response = await apiClient.patch(`/api/cases/${caseId}/status`, { status });
      return response.data.data;
    },
    onMutate: async ({ caseId, status }) => {
      await queryClient.cancelQueries({ queryKey: [CASES_KEY] });
      const previousQueries = queryClient.getQueriesData<CasesApiResponse>({
        queryKey: [CASES_KEY],
      });
      setOptimisticClosedCases((prev) => ({
        ...prev,
        [caseId]: status === CaseStatus.CLOSED,
      }));
      previousQueries.forEach(([key, value]) => {
        if (!value) return;
        queryClient.setQueryData<CasesApiResponse | undefined>(key, {
          ...value,
          cases: value.cases.map((caseItem) =>
            caseItem.id === caseId ? { ...caseItem, status } : caseItem
          ),
        });
      });
      closingCaseIdRef.current = caseId;
      return { previousQueries };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey as any, previousData);
        });
      }
      setOptimisticClosedCases((prev) => {
        const next = { ...prev };
        delete next[variables.caseId];
        return next;
      });
      toast.error(
        error?.response?.data?.error || 'Failed to update case status. Please try again.'
      );
    },
    onSuccess: (_, variables) => {
      toast.success('Case marked as closed.');
      setOptimisticAppointments((prev) => {
        if (!prev[variables.caseId]) return prev;
        const next = { ...prev };
        delete next[variables.caseId];
        return next;
      });
    },
    onSettled: (_, __, variables) => {
      closingCaseIdRef.current = null;
      queryClient.invalidateQueries({ queryKey: [CASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_KEY, variables.caseId] });
    },
  });

  const markCaseClosed = useCallback(
    (caseItem: Case) => {
      if (updateCaseStatusMutation.isPending && closingCaseIdRef.current === caseItem.id) return;
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(
          `Mark case ${caseItem.referenceNumber} as closed? This will move it out of the active list.`
        );
        if (!confirmed) {
          return;
        }
      }
      updateCaseStatusMutation.mutate({ caseId: caseItem.id, status: CaseStatus.CLOSED });
    },
    [updateCaseStatusMutation]
  );

  const isClient = user?.role === 'CLIENT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isClient ? 'My Cases' : 'Cases'}</h1>
          <p className="text-muted-foreground mt-2">
            {isClient ? 'View and track your immigration cases' : 'Manage all immigration cases'}
          </p>
        </div>
        {!isClient && (
          <Button asChild>
            <Link href="/dashboard/cases/new">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search cases by reference number or service type"
                placeholder="Search by reference or service type..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="DOCUMENTS_REQUIRED">Documents Required</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : isClient
                  ? 'You do not have any cases yet'
                  : 'No cases created yet'}
            </p>
            {!isClient && (
              <Button asChild>
                <Link href="/dashboard/cases/new">Create First Case</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedCases.map((c: Case) => {
              const optimisticAppointment = optimisticAppointments[c.id];
              const appointmentInfo = optimisticAppointment ?? c.appointments?.[0] ?? null;
              const hasAppointment = Boolean(appointmentInfo);
              const caseStatus = optimisticClosedCases[c.id] ? CaseStatus.CLOSED : c.status;
              const isCaseClosed = caseStatus === CaseStatus.CLOSED;
              const isClosing =
                updateCaseStatusMutation.isPending && closingCaseIdRef.current === c.id;
              const appointmentLabel = appointmentInfo
                ? formatDateTime(appointmentInfo.scheduledAt)
                : '';

              return (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          {c.referenceNumber}
                        </CardTitle>
                        <CardDescription>
                          {serviceLabels[c.serviceType] || c.serviceType}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          className={cn(
                            'flex items-center gap-1',
                            statusConfig[caseStatus]?.className || ''
                          )}
                        >
                          {statusConfig[caseStatus]?.label || caseStatus}
                        </Badge>
                        {hasAppointment && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{appointmentLabel}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Submitted:</span>
                        <span>{new Date(c.submissionDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{new Date(c.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      {c.assignedAgent && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Advisor:</span>
                          <span>
                            {c.assignedAgent.firstName} {c.assignedAgent.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    {hasAppointment && (
                      <div className="mt-4 space-y-3 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{appointmentLabel}</span>
                          </div>
                          {appointmentInfo?.location && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="line-clamp-1">{appointmentInfo.location}</span>
                            </div>
                          )}
                        </div>
                        {!isCaseClosed ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={isClosing}
                            onClick={() => markCaseClosed(c)}
                          >
                            {isClosing ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Closing...
                              </>
                            ) : (
                              <>
                                <Briefcase className="h-4 w-4" />
                                Mark Case as Closed
                              </>
                            )}
                          </Button>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-500 text-emerald-600 bg-emerald-50"
                          >
                            Case Closed
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {c.documents?.length || 0} documents
                      </span>
                      <div className="flex items-center gap-2">
                        {!isClient && !isCaseClosed && c.status === CaseStatus.APPROVED && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleManageAppointment(c)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {hasAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/cases/${c.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls - Mobile Optimized */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filtered.length)} of{' '}
                    {filtered.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first, last, current, and adjacent pages
                          return (
                            page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="h-8 w-8 p-0"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedCase && (
        <ScheduleAppointmentDialog
          caseId={selectedCase.id}
          caseReference={selectedCase.referenceNumber}
          clientName={
            selectedCase.client
              ? `${selectedCase.client.firstName ?? ''} ${selectedCase.client.lastName ?? ''}`.trim()
              : undefined
          }
          open={appointmentDialogOpen}
          onOpenChange={handleAppointmentDialogChange}
          onAppointmentScheduled={(appointment) =>
            handleAppointmentScheduled(appointment, selectedCase.id)
          }
        />
      )}
    </div>
  );
}

/**
 * PERFORMANCE OPTIMIZED: Progressive skeleton with real case card structure
 * - Shows actual case card layout immediately
 * - Better perceived performance than empty skeletons
 * - Mobile-optimized for instant display
 * - Reduced DOM elements while maintaining structure
 */
export const CasesListSkeleton = memo(function CasesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText size="xl" className="w-48" />
          <SkeletonText size="sm" className="w-80" />
        </div>
        <SimpleSkeleton className="h-10 w-32 rounded" />
      </div>

      {/* Search/Filter Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <SimpleSkeleton className="h-10 flex-1 rounded" />
            <SimpleSkeleton className="h-10 w-full sm:w-[200px] rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Case Cards with Progressive Placeholders */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <CaseCardPlaceholder key={i} />
        ))}
      </div>
    </div>
  );
});
