'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Bell,
  CheckCheck,
  Briefcase,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/utils/axios';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Types
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl?: string | null;
  case?: {
    id: string;
    referenceNumber: string;
    serviceType: string;
  } | null;
}

interface NotificationsTableProps {
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

// Notification type configuration
const notifConfig: Record<string, { icon: any; className: string }> = {
  CASE_STATUS_UPDATE: {
    icon: Briefcase,
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  NEW_MESSAGE: {
    icon: MessageSquare,
    className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  DOCUMENT_UPLOADED: {
    icon: FileText,
    className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  DOCUMENT_VERIFIED: {
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  DOCUMENT_REJECTED: {
    icon: AlertCircle,
    className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  CASE_ASSIGNED: {
    icon: User,
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  SYSTEM_ANNOUNCEMENT: {
    icon: Bell,
    className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
};

export function NotificationsTable({ onMarkAsRead, onMarkAllAsRead }: NotificationsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Table state
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const limit = 10;

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit,
    };

    if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;

    // Sorting
    if (sorting.length > 0) {
      params.sortBy = sorting[0].id;
      params.sortOrder = sorting[0].desc ? 'desc' : 'asc';
    }

    return params;
  }, [page, limit, typeFilter, statusFilter, debouncedSearch, sorting]);

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', queryParams],
    queryFn: async () => {
      const response = await apiClient.get('/api/notifications', { params: queryParams });
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds for fresh notifications
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.put(`/api/notifications/${id}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notifications.markedAsRead'));
    },
    onError: (error) => {
      logger.error('Failed to mark notification as read:', error);
      toast.error(t('notifications.markAsReadError'));
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notifications.allMarkedAsRead'));
    },
    onError: (error) => {
      logger.error('Failed to mark all as read:', error);
      toast.error(t('notifications.markAllAsReadError'));
    },
  });

  // Format time helper
  const formatTime = useCallback(
    (date: string) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return t('notifications.invalidDate');
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return t('notifications.justNow');
      if (diffMins < 60) return t('notifications.minsAgo', { mins: diffMins });
      if (diffHours < 24) return t('notifications.hoursAgo', { hours: diffHours });
      if (diffDays === 1) return t('notifications.yesterday');
      if (diffDays < 7) return t('notifications.daysAgo', { days: diffDays });
      return d.toLocaleDateString();
    },
    [t]
  );

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read if unread
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id);
        onMarkAsRead?.(notification.id);
      }

      // Navigate if actionUrl exists
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    },
    [markAsReadMutation, router, onMarkAsRead]
  );

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
    onMarkAllAsRead?.();
  }, [markAllAsReadMutation, onMarkAllAsRead]);

  // Table columns
  const columns = useMemo<ColumnDef<Notification>[]>(
    () => [
      {
        id: 'type',
        header: t('notifications.table.type'),
        cell: ({ row }) => {
          const Icon = notifConfig[row.original.type]?.icon || Bell;
          return (
            <div
              className={cn(
                'p-2 rounded-lg inline-flex',
                notifConfig[row.original.type]?.className
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          );
        },
      },
      {
        accessorKey: 'title',
        header: t('notifications.table.notification'),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              {row.original.title}
              {!row.original.isRead && <span className="h-2 w-2 bg-primary rounded-full" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{row.original.message}</p>
            {row.original.case && (
              <p className="text-xs text-muted-foreground">
                {t('notifications.table.case')}: {row.original.case.referenceNumber}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: t('notifications.table.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.isRead ? 'secondary' : 'default'}>
            {row.original.isRead ? t('notifications.table.read') : t('notifications.table.unread')}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent p-0 h-auto font-medium"
            >
              {t('notifications.table.created')}
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(row.original.createdAt)}
          </div>
        ),
      },
      {
        accessorKey: 'readAt',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent p-0 h-auto font-medium"
            >
              {t('notifications.table.readAt')}
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.readAt ? formatTime(row.original.readAt) : '—'}
          </div>
        ),
      },
    ],
    [t, formatTime]
  );

  // Initialize table
  const table = useReactTable({
    data: data?.notifications || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    pageCount: data?.pagination?.totalPages || 0,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const unreadCount = data?.unreadCount || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('notifications.errorLoading')}</h3>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            {t('common.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t('notifications.pageTitle')}</h1>
            {unreadCount > 0 && (
              <Badge variant="default">
                {unreadCount} {t('notifications.unread')}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{t('notifications.pageSubtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {t('notifications.markAllAsRead')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('notifications.table.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={t('notifications.table.filterType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('notifications.table.allTypes')}</SelectItem>
                <SelectItem value="CASE_STATUS_UPDATE">
                  {t('notifications.filters.caseUpdates')}
                </SelectItem>
                <SelectItem value="CASE_ASSIGNED">
                  {t('notifications.filters.caseAssigned')}
                </SelectItem>
                <SelectItem value="NEW_MESSAGE">{t('notifications.filters.messages')}</SelectItem>
                <SelectItem value="DOCUMENT_UPLOADED">
                  {t('notifications.filters.documentUploaded')}
                </SelectItem>
                <SelectItem value="DOCUMENT_VERIFIED">
                  {t('notifications.filters.documentVerified')}
                </SelectItem>
                <SelectItem value="DOCUMENT_REJECTED">
                  {t('notifications.filters.documentRejected')}
                </SelectItem>
                <SelectItem value="SYSTEM_ANNOUNCEMENT">
                  {t('notifications.filters.announcements')}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('notifications.table.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('notifications.table.allStatuses')}</SelectItem>
                <SelectItem value="unread">{t('notifications.table.unread')}</SelectItem>
                <SelectItem value="read">{t('notifications.table.read')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <NotificationsTableSkeleton />
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('notifications.noNotifications')}</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all' || typeFilter !== 'all' || debouncedSearch
                  ? t('notifications.noMatchingFilters')
                  : t('notifications.allCaughtUp')}
              </p>
            </div>
          ) : (
            <>
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
                      <TableRow
                        key={row.id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/50',
                          !row.original.isRead && 'bg-muted/30'
                        )}
                        onClick={() => handleNotificationClick(row.original)}
                      >
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('notifications.table.showing', {
                    from: (pagination.page - 1) * pagination.limit + 1,
                    to: Math.min(pagination.page * pagination.limit, pagination.total),
                    total: pagination.total,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('common.previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t('notifications.table.page', {
                      current: pagination.page,
                      total: pagination.totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    {t('common.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton loader matching table layout
export function NotificationsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableHead key={i}>
                  <SimpleSkeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <SimpleSkeleton className="h-8 w-8 rounded-lg" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <SimpleSkeleton className="h-4 w-48" />
                    <SimpleSkeleton className="h-3 w-64" />
                  </div>
                </TableCell>
                <TableCell>
                  <SimpleSkeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <SimpleSkeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <SimpleSkeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <SimpleSkeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <SimpleSkeleton className="h-9 w-24" />
          <SimpleSkeleton className="h-4 w-20" />
          <SimpleSkeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
