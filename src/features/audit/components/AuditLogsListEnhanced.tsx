'use client';

import { useAuthStore } from '@/features/auth/store';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useActivityLogs, exportActivityLogs } from '../api';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Shield,
  Search,
  Download,
  Filter,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { ActivityLog } from '../api/types';
import { useTranslation } from 'react-i18next';

export function AuditLogsListEnhanced() {
  const { t } = useTranslation();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, userIdFilter, startDate, endDate]);

  // Build filters object
  const filters = useMemo(
    () => ({
      page: currentPage,
      limit,
      search: searchQuery || undefined,
      action: actionFilter || undefined,
      userId: userIdFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [currentPage, limit, searchQuery, actionFilter, userIdFilter, startDate, endDate]
  );

  // Fetch activity logs
  const { data, isLoading, error, refetch } = useActivityLogs(filters, {
    enabled: !isAuthLoading && !!user && user.role === 'ADMIN',
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Handle export
  const handleExport = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      toast.info(t('auditLogs.preparingExport'));
      await exportActivityLogs({
        search: searchQuery || undefined,
        action: actionFilter || undefined,
        userId: userIdFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success(t('auditLogs.exportSuccess'));
    } catch (error) {
      toast.error(t('auditLogs.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [searchQuery, actionFilter, userIdFilter, startDate, endDate, isExporting]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setActionFilter('');
    setUserIdFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    toast.info(t('auditLogs.filtersCleared'));
  }, []);

  // Get badge colors based on role - MOVED BEFORE EARLY RETURN
  const getRoleBadgeColor = useCallback((role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }, []);

  // Format timestamp - MOVED BEFORE EARLY RETURN
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  }, []);

  // Define table columns with TanStack Table - MOVED BEFORE EARLY RETURN
  const columns = useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('auditLogs.timestamp')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const timestamp = formatTimestamp(row.original.timestamp);
          return (
            <div className="flex flex-col text-sm w-[180px]">
              <span className="font-medium">{timestamp.date}</span>
              <span className="text-muted-foreground text-xs">{timestamp.time}</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'userName',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('auditLogs.user')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">{row.original.userName}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.userEmail}
            </span>
            <Badge
              className={`${getRoleBadgeColor(row.original.userRole)} w-fit text-xs`}
              variant="secondary"
            >
              {row.original.userRole}
            </Badge>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'action',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('auditLogs.action')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.action}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'description',
        header: t('auditLogs.description'),
        cell: ({ row }) => (
          <p className="text-sm max-w-md line-clamp-2">{row.original.description}</p>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'ipAddress',
        header: t('auditLogs.ipAddress'),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.ipAddress || 'N/A'}
          </span>
        ),
        enableSorting: false,
      },
    ],
    [formatTimestamp, getRoleBadgeColor, t]
  );

  // Prepare data for table - MOVED BEFORE EARLY RETURNS
  const logs = data?.logs || [];
  const pagination = data?.pagination;
  const totalLogs = pagination?.totalCount || 0;
  const totalPages = pagination?.totalPages || 1;
  const hasActiveFilters = searchQuery || actionFilter || userIdFilter || startDate || endDate;

  // Initialize TanStack Table - MOVED BEFORE EARLY RETURNS
  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualPagination: true, // Server-side pagination
    pageCount: totalPages,
  });

  // Return null if not admin - MOVED AFTER ALL HOOKS
  if (user?.role !== 'ADMIN') {
    return null;
  }

  // Show loading skeleton
  if (isLoading && !data) return <AuditLogsListSkeleton />;

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Shield className="inline-block mr-2 h-8 w-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Track all system activities and changes for security and compliance
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{t('auditLogs.failedToLoad')}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('auditLogs.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Shield className="inline-block mr-2 h-8 w-8 text-primary" />
            {t('auditLogs.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('auditLogs.trackAllActivities')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-4 py-2">
            {totalLogs} {totalLogs === 1 ? t('auditLogs.entry') : t('auditLogs.entries')}
          </Badge>
          <Button onClick={handleExport} variant="outline" disabled={isExporting || isLoading}>
            <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
            {isExporting ? t('auditLogs.exporting') : t('auditLogs.export')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('auditLogs.searchPlaceholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t('auditLogs.filters')}
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                        {[actionFilter, userIdFilter, startDate, endDate].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-3">
                        {t('auditLogs.filterActivityLogs')}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="action-filter" className="text-sm">
                        {t('auditLogs.action')}
                      </Label>
                      <Input
                        id="action-filter"
                        placeholder={t('auditLogs.actionPlaceholder')}
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-filter" className="text-sm">
                        {t('auditLogs.userID')}
                      </Label>
                      <Input
                        id="user-filter"
                        placeholder={t('auditLogs.filterByUserID')}
                        value={userIdFilter}
                        onChange={(e) => setUserIdFilter(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-sm">
                        {t('auditLogs.startDate')}
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-sm">
                        {t('auditLogs.endDate')}
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleClearFilters}
                      >
                        {t('auditLogs.clearAll')}
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => setFiltersOpen(false)}>
                        {t('auditLogs.apply')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {actionFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {t('auditLogs.actionLabel')} {actionFilter}
                    <button
                      onClick={() => setActionFilter('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {userIdFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {t('auditLogs.userLabel')} {userIdFilter.substring(0, 8)}...
                    <button
                      onClick={() => setUserIdFilter('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {startDate && (
                  <Badge variant="secondary" className="gap-1">
                    {t('auditLogs.fromLabel')} {new Date(startDate).toLocaleDateString()}
                    <button
                      onClick={() => setStartDate('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="secondary" className="gap-1">
                    {t('auditLogs.toLabel')} {new Date(endDate).toLocaleDateString()}
                    <button
                      onClick={() => setEndDate('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? t('auditLogs.noLogsMatchFilters') : t('auditLogs.noLogsYet')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? t('auditLogs.adjustFilters') : t('auditLogs.systemActivity')}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                {t('auditLogs.clearFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {t('auditLogs.activityLogs')}
            </CardTitle>
            <CardDescription>{t('auditLogs.detailedAuditTrail')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <CardContent className="border-t py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {t('auditLogs.page', { current: currentPage, total: totalPages, totalLogs })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">{t('auditLogs.previous')}</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      const page = i + 1;
                      if (totalPages <= 5) return page;
                      if (currentPage <= 3) return page;
                      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
                      return currentPage - 2 + i;
                    }).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-9 h-9 p-0"
                        disabled={isLoading}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <span className="hidden sm:inline mr-1">{t('auditLogs.next')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

export function AuditLogsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 py-3 border-b last:border-0">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
