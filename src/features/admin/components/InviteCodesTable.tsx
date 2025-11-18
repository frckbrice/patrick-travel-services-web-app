'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { apiClient } from '@/lib/utils/axios';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';
import {
  Copy,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Calendar,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface InviteCode {
  id: string;
  code: string;
  role: 'AGENT' | 'ADMIN';
  createdById: string;
  lastUsedById: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  purpose: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  createdByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  lastUsedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InviteCodesTableProps {
  onRefresh?: () => void;
}

export function InviteCodesTable({ onRefresh }: InviteCodesTableProps) {
  const { t } = useTranslation();

  // State for filters and pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(pagination.pageIndex + 1));
    params.set('limit', String(pagination.pageSize));

    if (roleFilter && roleFilter !== 'all') {
      params.set('role', roleFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    }

    return params.toString();
  }, [pagination, roleFilter, statusFilter, debouncedSearch, sorting]);

  // Fetch data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invite-codes-table', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: {
          inviteCodes: InviteCode[];
          pagination: PaginationMetadata;
        };
      }>(`${ROUTES.API.ADMIN.INVITE_CODES}?${queryParams}`);
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const inviteCodes = data?.inviteCodes || [];
  const paginationMeta = data?.pagination;

  // Copy to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(t('inviteCodes.copiedToClipboard')))
      .catch(() => toast.error('Failed to copy'));
  };

  // Calculate status
  const getStatus = (code: InviteCode): 'active' | 'expired' | 'exhausted' => {
    if (code.usedCount >= code.maxUses) return 'exhausted';
    if (!code.isActive || new Date(code.expiresAt) <= new Date()) return 'expired';
    return 'active';
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: 'active' | 'expired' | 'exhausted' }) => {
    const config = {
      active: {
        label: t('inviteCodes.status.active'),
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      },
      expired: {
        label: t('inviteCodes.status.expired'),
        icon: Clock,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      },
      exhausted: {
        label: t('inviteCodes.status.exhausted'),
        icon: XCircle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      },
    }[status];

    const Icon = config.icon;

    return (
      <Badge variant="secondary" className={cn('gap-1', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Define columns
  const columns = useMemo<ColumnDef<InviteCode>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('inviteCodes.table.code')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <code className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded truncate max-w-[120px] sm:max-w-none">
              {row.original.code}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(row.original.code)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('inviteCodes.table.role')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const role = row.original.role;
          const Icon = role === 'ADMIN' ? Shield : Users;
          return (
            <Badge
              variant="secondary"
              className={cn(
                'gap-1',
                role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              )}
            >
              <Icon className="h-3 w-3" />
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'purpose',
        header: t('inviteCodes.table.purpose'),
        cell: ({ row }) => (
          <span className="text-xs sm:text-sm text-muted-foreground truncate block max-w-[150px] sm:max-w-none">
            {row.original.purpose || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'usedCount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('inviteCodes.table.usage')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
              {row.original.usedCount}/{row.original.maxUses}
            </span>
            <div className="w-16 bg-muted/80 dark:bg-muted/60 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  row.original.usedCount >= row.original.maxUses ? 'bg-red-500' : 'bg-green-500'
                )}
                style={{
                  width: `${(row.original.usedCount / row.original.maxUses) * 100}%`,
                }}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        header: t('inviteCodes.table.status'),
        cell: ({ row }) => <StatusBadge status={getStatus(row.original)} />,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('inviteCodes.table.created')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs sm:text-sm font-medium">
              {new Date(row.original.createdAt).toLocaleDateString()}
            </span>
            {row.original.createdByUser && (
              <span className="text-xs text-muted-foreground truncate">
                by {row.original.createdByUser.firstName} {row.original.createdByUser.lastName}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('inviteCodes.table.expires')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const expiresAt = new Date(row.original.expiresAt);
          const isExpired = expiresAt <= new Date();
          return (
            <span className={cn('text-xs sm:text-sm font-medium', isExpired && 'text-red-500')}>
              {expiresAt.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'lastUsedAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('inviteCodes.table.lastUsed')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          if (!row.original.lastUsedAt) {
            return <span className="text-xs sm:text-sm text-muted-foreground">-</span>;
          }
          return (
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-xs sm:text-sm font-medium">
                {new Date(row.original.lastUsedAt).toLocaleDateString()}
              </span>
              {row.original.lastUsedByUser && (
                <span className="text-xs text-muted-foreground truncate">
                  by {row.original.lastUsedByUser.firstName} {row.original.lastUsedByUser.lastName}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [t]
  );

  // Initialize table
  const table = useReactTable({
    data: inviteCodes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: paginationMeta?.totalPages ?? 0,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Failed to load invite codes. Please try again.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            {t('common.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('inviteCodes.table.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm sm:text-base"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('inviteCodes.table.filterRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inviteCodes.table.allRoles')}</SelectItem>
            <SelectItem value="AGENT">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                AGENT
              </div>
            </SelectItem>
            <SelectItem value="ADMIN">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                ADMIN
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('inviteCodes.table.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inviteCodes.table.allStatuses')}</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('inviteCodes.status.active')}
              </div>
            </SelectItem>
            <SelectItem value="expired">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                {t('inviteCodes.status.expired')}
              </div>
            </SelectItem>
            <SelectItem value="exhausted">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                {t('inviteCodes.status.exhausted')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
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
                {isLoading ? (
                  <InviteCodesTableSkeleton columnCount={columns.length} />
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {t('inviteCodes.table.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {paginationMeta && paginationMeta.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm sm:text-base text-muted-foreground text-center sm:text-left">
            {t('inviteCodes.table.showing', {
              from: pagination.pageIndex * pagination.pageSize + 1,
              to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, paginationMeta.total),
              total: paginationMeta.total,
            })}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm sm:text-base font-medium">
              {t('inviteCodes.table.page', {
                current: pagination.pageIndex + 1,
                total: paginationMeta.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(paginationMeta.totalPages - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton loader matching table layout
function InviteCodesTableSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell key={j}>
              <SimpleSkeleton className="h-6 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
