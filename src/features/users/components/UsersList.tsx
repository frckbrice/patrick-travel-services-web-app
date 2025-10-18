'use client';

import { useAuthStore } from '@/features/auth/store';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useUsers, useUpdateUser, useDeleteUser } from '../api';
import { UserRole } from '../types';
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getInitials } from '@/lib/utils/helpers';

export function UsersList() {
  const { user, isLoading: isAuthLoading, accessToken } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // PERFORMANCE & SECURITY: Server-side pagination - only fetch what we need
  const { data, isLoading, error, refetch } = useUsers(
    {
      role: roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: 20, // 20 users per page for optimal performance
    },
    {
      enabled: !isAuthLoading && !!user && !!accessToken && user.role === 'ADMIN',
    }
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchQuery]);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  useEffect(() => {
    // Only ADMIN can access this page
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user?.role !== 'ADMIN') {
    return null;
  }

  const handleEdit = (targetUser: any) => {
    setSelectedUser(targetUser);
    setEditRole(targetUser.role);
    setEditIsActive(targetUser.isActive);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
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
  };

  const handleDelete = (targetUser: any) => {
    setSelectedUser(targetUser);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleToggleActive = async (targetUser: any) => {
    try {
      await updateUser.mutateAsync({
        id: targetUser.id,
        updates: { isActive: !targetUser.isActive },
      });
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (isLoading) return <UsersListSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage system users and permissions</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load users. Please try again.</p>
            <Button className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination;
  const totalUsers = pagination?.total || users.length;
  const totalPages = pagination?.totalPages || 1;

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return colors[role] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Shield className="inline-block mr-2 h-8 w-8 text-primary" />
            {t('users.userManagement')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('users.manageSystemUsers')}</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          {totalUsers} {totalUsers === 1 ? t('users.user') : t('users.title')}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">{t('users.all')}</TabsTrigger>
                <TabsTrigger value="client">{t('users.clients')}</TabsTrigger>
                <TabsTrigger value="agent">{t('users.agents')}</TabsTrigger>
                <TabsTrigger value="admin">{t('users.admins')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || roleFilter !== 'all'
                ? t('users.noUsersFound')
                : t('users.noUsersYet')}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || roleFilter !== 'all'
                ? t('users.adjustFilters')
                : t('users.usersWillAppear')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {t('users.systemUsers')}
            </CardTitle>
            <CardDescription>{t('users.viewManageUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.user')}</TableHead>
                  <TableHead>{t('users.contact')}</TableHead>
                  <TableHead>{t('users.role')}</TableHead>
                  <TableHead>{t('users.status')}</TableHead>
                  <TableHead>{t('users.joined')}</TableHead>
                  <TableHead className="text-right">{t('users.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData: any) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(`${userData.firstName} ${userData.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {userData.firstName} {userData.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{userData.email}</span>
                        </div>
                        {userData.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{userData.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(userData.role)}>{userData.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={userData.isActive ? 'default' : 'secondary'}>
                        {userData.isActive ? (
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('users.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(userData)}>
                            {t('users.editUser')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(userData)}>
                            {userData.isActive ? t('users.deactivate') : t('users.activate')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(userData)}
                            disabled={userData.id === user?.id}
                          >
                            {t('users.deleteUser')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <CardContent className="border-t py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalUsers} total)
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show first, last, and pages around current
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
                      >
                        {page}
                      </Button>
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
          )}
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.editUserDialog.title')}</DialogTitle>
            <DialogDescription>{t('users.editUserDialog.description')}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
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
                <Label htmlFor="edit-role">{t('users.editUserDialog.roleLabel')}</Label>
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
                <Label htmlFor="edit-status">{t('users.editUserDialog.statusLabel')}</Label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateUser.isPending}>
              {updateUser.isPending ? t('users.saving') : t('users.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.deleteUserDialog.title')}</DialogTitle>
            <DialogDescription>{t('users.deleteUserDialog.description')}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
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
                  <Badge className={getRoleBadgeColor(selectedUser.role)} variant="outline">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending
                ? t('users.deleteUserDialog.deleting')
                : t('users.deleteUserDialog.deleteButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function UsersListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[400px]" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
