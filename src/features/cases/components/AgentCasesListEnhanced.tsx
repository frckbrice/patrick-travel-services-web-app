'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '../api';
import { useUsers } from '@/features/users/api/queries';
import { useBulkCaseOperation, useExportCases } from '../api/mutations';
import { AssignCaseDialog } from './AssignCaseDialog';
import type { Case } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Briefcase,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  Edit,
  AlertTriangle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  CheckSquare,
  XSquare,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

const statusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: {
    label: 'New Submission',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  DOCUMENTS_REQUIRED: {
    label: 'Awaiting Documents',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NORMAL: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  HIGH: {
    label: 'High',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const serviceLabels: Record<string, string> = {
  STUDENT_VISA: 'Student Visa',
  WORK_PERMIT: 'Work Permit',
  FAMILY_REUNIFICATION: 'Family Reunification',
  TOURIST_VISA: 'Tourist Visa',
  BUSINESS_VISA: 'Business Visa',
  PERMANENT_RESIDENCY: 'Permanent Residency',
};

export function AgentCasesListEnhanced() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedAgentFilter, setAssignedAgentFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<Case | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useCases({
    status: statusFilter !== 'all' && statusFilter !== 'active' ? statusFilter : undefined,
  });

  // Fetch agents for filter (ADMIN only)
  const { data: usersData } = useUsers({ role: 'AGENT' }, { enabled: user?.role === 'ADMIN' });

  const bulkOperation = useBulkCaseOperation();
  const exportCases = useExportCases();

  // Translated labels
  const getServiceLabels = (): Record<string, string> => ({
    STUDENT_VISA: t('cases.serviceLabels.STUDENT_VISA'),
    WORK_PERMIT: t('cases.serviceLabels.WORK_PERMIT'),
    FAMILY_REUNIFICATION: t('cases.serviceLabels.FAMILY_REUNIFICATION'),
    TOURIST_VISA: t('cases.serviceLabels.TOURIST_VISA'),
    BUSINESS_VISA: t('cases.serviceLabels.BUSINESS_VISA'),
    PERMANENT_RESIDENCY: t('cases.serviceLabels.PERMANENT_RESIDENCY'),
  });

  const getStatusConfigTranslated = (): Record<string, { label: string; color: string }> => ({
    SUBMITTED: {
      label: t('cases.statusLabels.SUBMITTED'),
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    UNDER_REVIEW: {
      label: t('cases.statusLabels.UNDER_REVIEW'),
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    DOCUMENTS_REQUIRED: {
      label: t('cases.statusLabels.DOCUMENTS_REQUIRED'),
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    },
    PROCESSING: {
      label: t('cases.statusLabels.PROCESSING'),
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    },
    APPROVED: {
      label: t('cases.statusLabels.APPROVED'),
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    REJECTED: {
      label: t('cases.statusLabels.REJECTED'),
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    CLOSED: {
      label: t('cases.statusLabels.CLOSED'),
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
  });

  const translatedServiceLabels = getServiceLabels();
  const translatedStatusConfig = getStatusConfigTranslated();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoized filtered cases
  const filteredCases = useMemo(() => {
    if (!user?.id || !user?.role || !data?.cases) return [];
    let cases: Case[] = data.cases;

    // For AGENT: Filter to assigned cases only
    if (user.role === 'AGENT') {
      cases = cases.filter((c) => c.assignedAgentId === user.id);
    } else if (user.role === 'ADMIN') {
      if (assignmentFilter === 'unassigned') {
        cases = cases.filter((c) => !c.assignedAgentId);
      } else if (assignmentFilter === 'assigned') {
        cases = cases.filter((c) => !!c.assignedAgentId);
      }
    }

    // Active filter
    if (statusFilter === 'active') {
      cases = cases.filter((c) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status));
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      cases = cases.filter((c) => c.serviceType === serviceTypeFilter);
    }

    // Assigned agent filter (ADMIN only)
    if (assignedAgentFilter !== 'all' && user.role === 'ADMIN') {
      if (assignedAgentFilter === 'unassigned') {
        cases = cases.filter((c) => !c.assignedAgentId);
      } else {
        cases = cases.filter((c) => c.assignedAgentId === assignedAgentFilter);
      }
    }

    // Date range filter
    if (startDate || endDate) {
      cases = cases.filter((c) => {
        const submissionDate = new Date(c.submissionDate);
        if (startDate && submissionDate < new Date(startDate)) return false;
        if (endDate && submissionDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Search and priority filter
    return cases.filter((c) => {
      const clientName = c.client
        ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim()
        : '';
      const matchesSearch =
        debouncedSearch === '' ||
        c.referenceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        clientName.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [
    data?.cases,
    user?.role,
    user?.id,
    assignmentFilter,
    statusFilter,
    serviceTypeFilter,
    assignedAgentFilter,
    startDate,
    endDate,
    debouncedSearch,
    priorityFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedCases.size === paginatedCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(paginatedCases.map((c) => c.id)));
    }
  };

  const handleSelectCase = (caseId: string) => {
    const newSelection = new Set(selectedCases);
    if (newSelection.has(caseId)) {
      newSelection.delete(caseId);
    } else {
      newSelection.add(caseId);
    }
    setSelectedCases(newSelection);
  };

  const handleBulkAssign = async (agentId: string) => {
    if (selectedCases.size === 0) return;
    await bulkOperation.mutateAsync({
      operation: 'ASSIGN',
      caseIds: Array.from(selectedCases),
      data: { assignedAgentId: agentId },
    });
    setSelectedCases(new Set());
    refetch();
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedCases.size === 0) return;
    await bulkOperation.mutateAsync({
      operation: 'UPDATE_STATUS',
      caseIds: Array.from(selectedCases),
      data: { status },
    });
    setSelectedCases(new Set());
    refetch();
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    await exportCases.mutateAsync({
      format,
      status: statusFilter !== 'all' && statusFilter !== 'active' ? statusFilter : undefined,
      serviceType: serviceTypeFilter !== 'all' ? serviceTypeFilter : undefined,
      assignedAgentId:
        assignedAgentFilter !== 'all' && assignedAgentFilter !== 'unassigned'
          ? assignedAgentFilter
          : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: debouncedSearch || undefined,
    });
  };

  if (isLoading) return <AgentCasesListSkeleton />;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading cases</p>
      </div>
    );

  if (!user?.id) {
    logger.warn('AgentCasesListEnhanced: user.id is missing');
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Could Not Determine Current User</h3>
            <p className="text-muted-foreground mb-4">
              Please try refreshing the page or logging in again.
            </p>
            <Button asChild variant="default">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agents = usersData?.users || [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {user.role === 'ADMIN' ? t('cases.allCases') : t('cases.myCases')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {user.role === 'ADMIN'
                ? t('cases.management.manageAll')
                : t('cases.management.manageAssigned')}
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      {t('cases.management.export')}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{t('cases.management.exportFormat')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    {t('cases.management.exportCSV')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    {t('cases.management.exportXLSX')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <TooltipContent>
                <p>{t('cases.management.exportTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {filteredCases.length}{' '}
              {filteredCases.length === 1
                ? t('cases.management.case')
                : t('cases.management.cases')}
            </Badge>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('cases.management.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-10"
                />
              </div>

              {/* Service Type */}
              <Select
                value={serviceTypeFilter}
                onValueChange={(value) => {
                  setServiceTypeFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('cases.management.serviceType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cases.management.allServices')}</SelectItem>
                  {Object.entries(translatedServiceLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('cases.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('cases.management.activeCases')}</SelectItem>
                  <SelectItem value="all">{t('cases.management.allStatus')}</SelectItem>
                  <SelectItem value="SUBMITTED">{t('cases.statusLabels.SUBMITTED')}</SelectItem>
                  <SelectItem value="UNDER_REVIEW">
                    {t('cases.statusLabels.UNDER_REVIEW')}
                  </SelectItem>
                  <SelectItem value="DOCUMENTS_REQUIRED">
                    {t('cases.statusLabels.DOCUMENTS_REQUIRED')}
                  </SelectItem>
                  <SelectItem value="PROCESSING">{t('cases.statusLabels.PROCESSING')}</SelectItem>
                  <SelectItem value="APPROVED">{t('cases.statusLabels.APPROVED')}</SelectItem>
                  <SelectItem value="REJECTED">{t('cases.statusLabels.REJECTED')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Assigned Agent (ADMIN only) */}
              {user.role === 'ADMIN' && (
                <Select
                  value={assignedAgentFilter}
                  onValueChange={(value) => {
                    setAssignedAgentFilter(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('cases.management.assignedAgent')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('cases.management.allAgents')}</SelectItem>
                    <SelectItem value="unassigned">{t('cases.management.unassigned')}</SelectItem>
                    {agents.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Priority */}
              <Select
                value={priorityFilter}
                onValueChange={(value) => {
                  setPriorityFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('cases.priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cases.management.allPriority')}</SelectItem>
                  <SelectItem value="URGENT">{t('cases.priorityLabels.URGENT')}</SelectItem>
                  <SelectItem value="HIGH">{t('cases.priorityLabels.HIGH')}</SelectItem>
                  <SelectItem value="NORMAL">{t('cases.priorityLabels.NORMAL')}</SelectItem>
                  <SelectItem value="LOW">{t('cases.priorityLabels.LOW')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex gap-2 lg:col-span-2">
                <Input
                  type="date"
                  placeholder={t('cases.management.startDate')}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFilterChange();
                  }}
                  className="flex-1"
                />
                <Input
                  type="date"
                  placeholder={t('cases.management.endDate')}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleFilterChange();
                  }}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar (ADMIN only) */}
        {user.role === 'ADMIN' && selectedCases.size > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">
                    {selectedCases.size}{' '}
                    {selectedCases.size !== 1
                      ? t('cases.management.casesSelected')
                      : t('cases.management.caseSelected')}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCases(new Set())}>
                        <XSquare className="mr-2 h-4 w-4" />
                        {t('cases.management.clear')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('cases.management.clearSelection')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Tooltip>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t('cases.management.bulkAssign')}
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>{t('cases.management.assignToAgent')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {agents.map((agent: any) => (
                          <DropdownMenuItem
                            key={agent.id}
                            onClick={() => handleBulkAssign(agent.id)}
                          >
                            {agent.firstName} {agent.lastName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipContent>
                      <p>{t('cases.management.assignSelectedCases')}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            {t('cases.management.bulkStatus')}
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>{t('cases.management.updateStatus')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(translatedStatusConfig).map(([key, config]) => (
                          <DropdownMenuItem key={key} onClick={() => handleBulkStatusUpdate(key)}>
                            {config.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipContent>
                      <p>{t('cases.management.updateStatusSelected')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('cases.management.noCasesFound')}</h3>
              <p className="text-muted-foreground">{t('cases.management.noMatchingFilters')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cases Table - Mobile Responsive with Horizontal Scroll */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {user.role === 'ADMIN' && (
                          <th className="px-3 py-3 text-left">
                            <Checkbox
                              checked={
                                selectedCases.size === paginatedCases.length &&
                                paginatedCases.length > 0
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.reference')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.customer')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.serviceType')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.assignedAgent')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedCases.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {user.role === 'ADMIN' && (
                            <td className="px-3 py-4">
                              <Checkbox
                                checked={selectedCases.has(c.id)}
                                onCheckedChange={() => handleSelectCase(c.id)}
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 text-primary mr-2" />
                              <span className="text-sm font-medium">{c.referenceNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium">
                                {c.client?.firstName} {c.client?.lastName}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">
                                {c.client?.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm">
                              {translatedServiceLabels[c.serviceType] || c.serviceType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={cn(translatedStatusConfig[c.status]?.color || '')}>
                              {translatedStatusConfig[c.status]?.label || c.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(c.submissionDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {c.assignedAgent ? (
                              <div className="text-sm">
                                {c.assignedAgent.firstName} {c.assignedAgent.lastName}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button asChild variant="ghost" size="sm">
                                    <Link href={`/dashboard/cases/${c.id}`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View & Edit Case Details</p>
                                </TooltipContent>
                              </Tooltip>

                              {user.role === 'ADMIN' && !c.assignedAgentId && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCaseForAssignment(c);
                                        setAssignDialogOpen(true);
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Assign Case to Agent</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredCases.length)} of{' '}
                      {filteredCases.length}
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

        {/* Assign Case Dialog */}
        {selectedCaseForAssignment && (
          <AssignCaseDialog
            caseData={selectedCaseForAssignment}
            open={assignDialogOpen}
            onOpenChange={(open) => {
              setAssignDialogOpen(open);
              if (!open) setSelectedCaseForAssignment(null);
            }}
            onSuccess={() => {
              refetch();
              setSelectedCaseForAssignment(null);
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export function AgentCasesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-10 lg:col-span-2" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
