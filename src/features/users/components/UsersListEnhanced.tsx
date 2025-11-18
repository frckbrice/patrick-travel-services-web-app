'use client';

import { useAuthStore } from '@/features/auth/store';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useUsers, useUpdateUser, useDeleteUser } from '../api';
import { UserRole } from '../types';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash,
  Power,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';

type UserData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
};

export function UsersListEnhanced() {
  const { user, isLoading: isAuthLoading, accessToken } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Mutations
  // Note: These hooks require QueryClientProvider to be available
  // The provider is set up in src/app/providers.tsx and should be available
  // If you see errors about QueryClient not being set, ensure the component
  // is rendered within the Providers wrapper in the root layout
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchQuery]);

  // PERFORMANCE & SECURITY: Server-side pagination - only fetch what we need
  const { data, isLoading, error, refetch } = useUsers(
    {
      role: roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit,
    },
    {
      enabled: !isAuthLoading && !!user && !!accessToken && user.role === 'ADMIN',
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  // Handlers
  const handleEdit = useCallback((targetUser: UserData) => {
    setSelectedUser(targetUser);
    setEditRole(targetUser.role);
    setEditIsActive(targetUser.isActive);
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedUser) return;

    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        updates: {
          role: editRole as UserRole,
          isActive: editIsActive,
        },
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  }, [selectedUser, editRole, editIsActive, updateUser, refetch]);

  const handleDelete = useCallback((targetUser: UserData) => {
    setSelectedUser(targetUser);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  }, [selectedUser, deleteUser, refetch]);

  const handleToggleActive = useCallback(
    async (targetUser: UserData) => {
      try {
        await updateUser.mutateAsync({
          id: targetUser.id,
          updates: { isActive: !targetUser.isActive },
        });
        refetch();
      } catch (error) {
        // Error handled in mutation
      }
    },
    [updateUser, refetch]
  );

  // Get badge colors based on role - MOVED BEFORE EARLY RETURN
  const getRoleBadgeColor = useCallback((role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }, []);

  // Define table columns with TanStack Table - MOVED BEFORE EARLY RETURN
  const getRoleLabel = useCallback(
    (role: string) => {
      const roleKeyMap: Record<string, string> = {
        ADMIN: 'users.admin',
        AGENT: 'users.agent',
        CLIENT: 'users.client',
      };

      const translationKey = roleKeyMap[role];
      return translationKey ? t(translationKey) : role;
    },
    [t]
  );

  const columns = useMemo<ColumnDef<UserData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('users.user')}
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
          <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarFallback className="text-xs sm:text-sm">
                {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium truncate">
                {row.original.firstName} {row.original.lastName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
        enableSorting: true,
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('users.contact')}
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
          <div className="space-y-1 text-xs sm:text-sm min-w-[180px]">
            <div className="flex items-center gap-1 text-muted-foreground min-w-0">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{row.original.email}</span>
            </div>
            {row.original.phone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{row.original.phone}</span>
              </div>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('users.role')}
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
          <Badge className={getRoleBadgeColor(row.original.role)} variant="secondary">
            {getRoleLabel(row.original.role)}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('users.status')}
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
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('users.active')}
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                {t('users.inactive')}
              </>
            )}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              {t('users.joined')}
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
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground min-w-[120px]">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {new Date(row.original.createdAt).toLocaleDateString()}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('users.actions')}</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('users.actionMenuLabel')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('users.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('users.editUser')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(row.original)}>
                          <Power className="mr-2 h-4 w-4" />
                          {row.original.isActive ? t('users.deactivate') : t('users.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(row.original)}
                          disabled={row.original.id === user?.id}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {t('users.deleteUser')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('users.actions')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [t, getRoleBadgeColor, handleEdit, handleToggleActive, handleDelete, user?.id, getRoleLabel]
  );

  // Prepare data for table - MOVED BEFORE EARLY RETURNS
  const users = data?.users || [];
  const pagination = data?.pagination;
  const totalUsers = pagination?.total || users.length;
  const totalPages = pagination?.totalPages || 1;
  const hasActiveFilters = searchQuery || roleFilter !== 'all';

  // Initialize TanStack Table - MOVED BEFORE EARLY RETURNS
  const table = useReactTable({
    data: users,
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
  if (isLoading && !data) return <UsersListSkeleton />;

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            <span className="wrap-break-word">{t('users.userManagement')}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            {t('users.manageSystemUsers')}
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-sm sm:text-base text-destructive mb-4">{t('users.loadError')}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
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
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            <span className="wrap-break-word">{t('users.userManagement')}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            {t('users.manageSystemUsers')}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 w-fit shrink-0"
        >
          {totalUsers} {totalUsers === 1 ? t('users.user') : t('users.title')}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                className="pl-10 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Tabs
                value={roleFilter}
                onValueChange={(value) => {
                  // Prevent any default behavior and update filter client-side
                  setRoleFilter(value);
                }}
                className="flex-1 sm:flex-none sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
                  <TabsTrigger
                    value="all"
                    type="button"
                    className="bg-transparent hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap transition-colors text-xs sm:text-sm"
                  >
                    {t('users.all')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="client"
                    type="button"
                    className="bg-transparent hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap transition-colors text-xs sm:text-sm"
                  >
                    {t('users.clients')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="agent"
                    type="button"
                    className="bg-transparent hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap transition-colors text-xs sm:text-sm"
                  >
                    {t('users.agents')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="admin"
                    type="button"
                    className="bg-transparent hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap transition-colors text-xs sm:text-sm"
                  >
                    {t('users.admins')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="sr-only">{t('common.refresh')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('common.refresh')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {hasActiveFilters ? t('users.noUsersFound') : t('users.noUsersYet')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {hasActiveFilters ? t('users.adjustFilters') : t('users.usersWillAppear')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl font-semibold">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              {t('users.systemUsers')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('users.viewManageUsers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* MOBILE RESPONSIVE: Horizontal scrollable container */}
            <div className="rounded-md border overflow-x-auto">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm sm:text-base text-muted-foreground text-center sm:text-left">
                  {t('users.paginationSummary', {
                    currentPage,
                    totalPages,
                    totalUsers,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || isLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">{t('common.previous')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('common.previous')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || isLoading}
                        >
                          <span className="hidden sm:inline mr-1">{t('common.next')}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('common.next')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {t('users.editUserDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {t('users.editUserDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">
                  {t('users.editUserDialog.userLabel')}
                </Label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(`${selectedUser.firstName} ${selectedUser.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-sm sm:text-base font-medium">
                  {t('users.editUserDialog.roleLabel')}
                </Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">{t('users.client')}</SelectItem>
                    <SelectItem value="AGENT">{t('users.agent')}</SelectItem>
                    <SelectItem value="ADMIN">{t('users.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm sm:text-base font-medium">
                  {t('users.editUserDialog.statusLabel')}
                </Label>
                <Select
                  value={editIsActive ? 'active' : 'inactive'}
                  onValueChange={(v) => setEditIsActive(v === 'active')}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('users.active')}</SelectItem>
                    <SelectItem value="inactive">{t('users.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateUser.isPending}
              className="w-full sm:w-auto"
            >
              {updateUser.isPending ? t('users.saving') : t('users.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={t('users.deleteUserDialog.title')}
        description={t('users.deleteUserDialog.confirmDescription', {
          name: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim() : '',
        })}
        confirmText={t('users.deleteUserDialog.deleteButton')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}

export function UsersListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-[400px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {/* User column with avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    {/* Contact column */}
                    <TableCell>
                      <div className="space-y-2 min-w-[180px]">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </TableCell>
                    {/* Role column */}
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    {/* Status column */}
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    {/* Joined column */}
                    <TableCell>
                      <Skeleton className="h-4 w-24 min-w-[120px]" />
                    </TableCell>
                    {/* Actions column */}
                    <TableCell className="text-right">
                      <Skeleton className="h-9 w-9 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
