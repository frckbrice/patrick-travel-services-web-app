'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store';
import { useCases, CasesFilters } from '../api';
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

  // Build server-side filters
  const filters: CasesFilters = {
    page: currentPage,
    limit: itemsPerPage,
  };

  if (statusFilter !== 'all') {
    filters.status = statusFilter;
  }

  if (serviceTypeFilter !== 'all') {
    filters.serviceType = serviceTypeFilter;
  }

  if (assignedAgentFilter !== 'all') {
    if (assignedAgentFilter === 'unassigned') {
      filters.assignedAgentId = 'unassigned';
    } else {
      filters.assignedAgentId = assignedAgentFilter;
    }
  }

  if (priorityFilter !== 'all') {
    filters.priority = priorityFilter;
  }

  if (startDate) {
    filters.startDate = startDate;
  }

  if (endDate) {
    filters.endDate = endDate;
  }

  if (debouncedSearch) {
    filters.search = debouncedSearch;
  }

  // Add assignment filter for ADMIN
  if (user?.role === 'ADMIN') {
    if (assignmentFilter === 'assigned') {
      filters.isAssigned = 'true';
    } else if (assignmentFilter === 'unassigned') {
      filters.isAssigned = 'false';
    }
  }

  // PERFORMANCE: Server-side pagination and filtering to handle large datasets efficiently
  const { data, isLoading, error, refetch } = useCases(filters);

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

  // Use server-side filtered cases directly
  const cases = data?.cases || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const totalPages = pagination.totalPages || 1;
  const totalCases = pagination.total || 0;

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Get selectable cases (exclude approved cases from bulk operations for non-admin users)
  // ADMIN can select approved cases
  const selectableCases =
    user?.role === 'ADMIN'
      ? cases // ADMIN can select all cases including approved
      : cases.filter((c) => c.status !== 'APPROVED'); // Non-admin cannot select approved cases
  const selectableCaseIds = new Set(selectableCases.map((c) => c.id));

  // Bulk selection handlers
  const handleSelectAll = () => {
    const allSelectableSelected = selectableCases.every((c) => selectedCases.has(c.id));
    if (allSelectableSelected) {
      // Deselect all selectable cases
      const newSelection = new Set(selectedCases);
      selectableCaseIds.forEach((id) => newSelection.delete(id));
      setSelectedCases(newSelection);
    } else {
      // Select all selectable cases
      const newSelection = new Set(selectedCases);
      selectableCaseIds.forEach((id) => newSelection.add(id));
      setSelectedCases(newSelection);
    }
  };

  const handleSelectCase = (caseId: string) => {
    // Prevent selecting approved cases for non-admin users
    const caseItem = cases.find((c) => c.id === caseId);
    if (caseItem?.status === 'APPROVED' && user?.role !== 'ADMIN') {
      return; // Do not allow non-admin to select approved cases
    }

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
    // Filter out approved cases for non-admin users before bulk operation
    const validCaseIds =
      user?.role === 'ADMIN'
        ? Array.from(selectedCases) // ADMIN can assign approved cases
        : Array.from(selectedCases).filter((id) => {
            const caseItem = cases.find((c) => c.id === id);
            return caseItem && caseItem.status !== 'APPROVED';
          });

    if (validCaseIds.length === 0) {
      const errorMessage =
        user?.role === 'ADMIN'
          ? t('cases.management.noValidCasesToAssign')
          : t('cases.management.noValidCasesToAssignApproved');
      toast.error(errorMessage);
      return;
    }

    await bulkOperation.mutateAsync({
      operation: 'ASSIGN',
      caseIds: validCaseIds,
      data: { assignedAgentId: agentId },
    });
    setSelectedCases(new Set());
    refetch();
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedCases.size === 0) return;
    // Filter out approved cases for non-admin users before bulk operation
    const validCaseIds =
      user?.role === 'ADMIN'
        ? Array.from(selectedCases) // ADMIN can update approved cases
        : Array.from(selectedCases).filter((id) => {
            const caseItem = cases.find((c) => c.id === id);
            return caseItem && caseItem.status !== 'APPROVED';
          });

    if (validCaseIds.length === 0) {
      const errorMessage =
        user?.role === 'ADMIN'
          ? t('cases.management.noValidCasesToUpdate')
          : t('cases.management.noValidCasesToUpdateApproved');
      toast.error(errorMessage);
      return;
    }

    await bulkOperation.mutateAsync({
      operation: 'UPDATE_STATUS',
      caseIds: validCaseIds,
      data: { status },
    });
    setSelectedCases(new Set());
    refetch();
  };

  const handleBulkUnassign = async () => {
    if (selectedCases.size === 0) return;
    // Filter out approved cases for non-admin users before bulk operation
    const validCaseIds =
      user?.role === 'ADMIN'
        ? Array.from(selectedCases) // ADMIN can unassign approved cases
        : Array.from(selectedCases).filter((id) => {
            const caseItem = cases.find((c) => c.id === id);
            return caseItem && caseItem.status !== 'APPROVED';
          });

    if (validCaseIds.length === 0) {
      const errorMessage =
        user?.role === 'ADMIN'
          ? t('cases.management.noValidCasesToUnassign')
          : t('cases.management.noValidCasesToUnassignApproved');
      toast.error(errorMessage);
      return;
    }

    await bulkOperation.mutateAsync({
      operation: 'UNASSIGN',
      caseIds: validCaseIds,
    });
    setSelectedCases(new Set());
    refetch();
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    await exportCases.mutateAsync({
      format,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      serviceType: serviceTypeFilter !== 'all' ? serviceTypeFilter : undefined,
      assignedAgentId: assignedAgentFilter !== 'all' ? assignedAgentFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: debouncedSearch || undefined,
    });
  };

  if (isLoading) return <AgentCasesListSkeleton />;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('cases.management.errorLoadingCases')}</p>
      </div>
    );

  if (!user?.id) {
    logger.warn('AgentCasesListEnhanced: user.id is missing');
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('cases.management.couldNotDetermineUser')}
            </h3>
            <p className="text-muted-foreground mb-4">{t('cases.management.refreshOrLogin')}</p>
            <Button asChild variant="default">
              <Link href="/login">{t('cases.management.returnToLogin')}</Link>
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
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight wrap-break-word">
              {user.role === 'ADMIN' ? t('cases.allCases') : t('cases.myCases')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
              {user.role === 'ADMIN'
                ? t('cases.management.manageAll')
                : t('cases.management.manageAssigned')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent hover:bg-muted/80 transition-colors"
                    >
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
            <Badge
              variant="secondary"
              className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 shrink-0"
            >
              {totalCases}{' '}
              {totalCases === 1 ? t('cases.management.case') : t('cases.management.cases')}
            </Badge>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-2">
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

              {/* Date Range - Inline */}
              <Input
                type="date"
                placeholder={t('cases.management.startDate')}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleFilterChange();
                }}
              />
              <Input
                type="date"
                placeholder={t('cases.management.endDate')}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar (ADMIN ONLY - Agents cannot assign/unassign cases) */}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCases(new Set())}
                        className="bg-transparent hover:bg-muted/80 transition-colors"
                      >
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm whitespace-nowrap bg-transparent hover:bg-muted/80 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground transition-colors"
                          >
                            <UserPlus className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm whitespace-nowrap bg-transparent hover:bg-muted/80 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground transition-colors"
                          >
                            <Filter className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
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

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkUnassign}
                        className="text-xs sm:text-sm whitespace-nowrap bg-transparent hover:bg-muted/80 transition-colors"
                      >
                        <XSquare className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                        {t('cases.management.bulkUnassign')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('cases.management.unassignSelectedCases')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {cases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('cases.management.noCasesFound')}</h3>
              <p className="text-muted-foreground">{t('cases.management.noMatchingFilters')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {cases.map((c) => (
                <Card
                  key={c.id}
                  className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header with Checkbox and Reference */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {user.role === 'ADMIN' && (
                          <Checkbox
                            checked={selectedCases.has(c.id)}
                            onCheckedChange={() => handleSelectCase(c.id)}
                            disabled={c.status === 'APPROVED' && user?.role !== 'ADMIN'}
                            className="mt-1 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-semibold truncate">
                              {c.referenceNumber}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              translatedStatusConfig[c.status]?.color || '',
                              'text-xs whitespace-nowrap'
                            )}
                          >
                            {translatedStatusConfig[c.status]?.label || c.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-transparent hover:bg-muted/80 transition-colors"
                              >
                                <Link href={`/dashboard/cases/${c.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('cases.management.viewEditCaseDetails')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {user.role === 'ADMIN' && !c.assignedAgentId && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-transparent hover:bg-muted/80 transition-colors"
                                  onClick={() => {
                                    setSelectedCaseForAssignment(c);
                                    setAssignDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('cases.management.assignCaseToAgent')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-1.5 pt-3 border-t border-border/50">
                      <div className="flex items-start gap-2.5">
                        <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate mb-0.5">
                            {c.client?.firstName} {c.client?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.client?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service Type and Date */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t('cases.table.serviceType')}
                        </p>
                        <p className="text-sm font-medium truncate">
                          {translatedServiceLabels[c.serviceType] || c.serviceType}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t('cases.table.date')}
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(c.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Assigned Agent */}
                    <div className="pt-3 border-t border-border/50">
                      {c.assignedAgent ? (
                        <div className="flex items-start gap-2.5">
                          <UserPlus className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                              {t('cases.table.assignedAgent')}
                            </p>
                            <p className="text-sm font-medium truncate">
                              {c.assignedAgent.firstName} {c.assignedAgent.lastName}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                              {t('cases.table.assignedAgent')}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {t('cases.management.unassigned')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {user.role === 'ADMIN' && (
                          <th className="px-3 py-3 text-left">
                            <Checkbox
                              checked={
                                selectableCases.length > 0 &&
                                selectableCases.every((c) => selectedCases.has(c.id))
                              }
                              onCheckedChange={handleSelectAll}
                              disabled={selectableCases.length === 0}
                            />
                          </th>
                        )}
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.reference')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.customer')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.serviceType')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.status')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.date')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.assignedAgent')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('cases.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {cases.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {user.role === 'ADMIN' && (
                            <td className="px-3 py-4">
                              <Checkbox
                                checked={selectedCases.has(c.id)}
                                onCheckedChange={() => handleSelectCase(c.id)}
                                disabled={c.status === 'APPROVED' && user?.role !== 'ADMIN'}
                                title={
                                  c.status === 'APPROVED' && user?.role !== 'ADMIN'
                                    ? t('cases.management.approvedCasesCannotBeSelected')
                                    : undefined
                                }
                              />
                            </td>
                          )}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center min-w-0">
                              <Briefcase className="h-4 w-4 text-primary mr-2 shrink-0" />
                              <span className="text-sm font-medium truncate">
                                {c.referenceNumber}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm min-w-0">
                              <div className="font-medium truncate">
                                {c.client?.firstName} {c.client?.lastName}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                {c.client?.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className="text-sm truncate block max-w-[120px] sm:max-w-none">
                              {translatedServiceLabels[c.serviceType] || c.serviceType}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={cn(
                                translatedStatusConfig[c.status]?.color || '',
                                'text-xs whitespace-nowrap'
                              )}
                            >
                              {translatedStatusConfig[c.status]?.label || c.status}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(c.submissionDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            {c.assignedAgent ? (
                              <div className="text-sm">
                                {c.assignedAgent.firstName} {c.assignedAgent.lastName}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {t('cases.management.unassigned')}
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="bg-transparent hover:bg-muted/80 transition-colors"
                                  >
                                    <Link href={`/dashboard/cases/${c.id}`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('cases.management.viewEditCaseDetails')}</p>
                                </TooltipContent>
                              </Tooltip>

                              {user.role === 'ADMIN' && !c.assignedAgentId && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="bg-transparent hover:bg-muted/80 transition-colors"
                                      onClick={() => {
                                        setSelectedCaseForAssignment(c);
                                        setAssignDialogOpen(true);
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('cases.management.assignCaseToAgent')}</p>
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      {t('cases.management.showing', {
                        from: (currentPage - 1) * itemsPerPage + 1,
                        to: Math.min(currentPage * itemsPerPage, totalCases),
                        total: totalCases,
                      })}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="bg-transparent hover:bg-muted/80 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">
                          {t('cases.management.previous')}
                        </span>
                      </Button>
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            return (
                              page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                            );
                          })
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-1 sm:px-2 text-muted-foreground text-xs sm:text-sm">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                  'h-8 w-8 p-0 text-xs sm:text-sm transition-colors',
                                  currentPage === page
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-transparent hover:bg-muted/80'
                                )}
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
                        className="bg-transparent hover:bg-muted/80 disabled:opacity-50 transition-colors"
                      >
                        <span className="hidden sm:inline mr-1">{t('cases.management.next')}</span>
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
