'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { useAuthStore } from '@/features/auth/store';
import { apiClient } from '@/lib/utils/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Clock,
  FileText,
  AlertCircle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Reply,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/helpers';

interface Email {
  id: string;
  senderId: string;
  recipientId: string;
  caseId: string | null;
  subject: string | null;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  case: {
    id: string;
    referenceNumber: string;
    serviceType: string;
  } | null;
}

interface ReceivedEmailsResponse {
  emails: Email[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function ReceivedEmailsTable() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadFilter, setIsReadFilter] = useState<'all' | 'read' | 'unread'>('all');

  // Dialog state
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'sentAt',
      desc: true, // Default: newest first
    },
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, isReadFilter]);

  // Build API query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('direction', 'incoming');
    params.append('page', String(pagination.pageIndex + 1)); // API uses 1-based pages
    params.append('limit', String(pagination.pageSize));

    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }

    if (isReadFilter !== 'all') {
      params.append('isRead', isReadFilter === 'read' ? 'true' : 'false');
    }

    // Add sorting
    if (sorting.length > 0) {
      const sort = sorting[0];
      params.append('sortBy', sort.id);
      params.append('sortOrder', sort.desc ? 'desc' : 'asc');
    }

    return params.toString();
  }, [pagination, searchQuery, isReadFilter, sorting]);

  // Fetch incoming emails with server-side pagination, filtering, and sorting
  const { data, isLoading, error } = useQuery<ReceivedEmailsResponse>({
    queryKey: ['received-emails', user?.id, queryParams],
    queryFn: async () => {
      const response = await apiClient.get(`/api/emails?${queryParams}`);
      return response.data.data;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
  });

  const emails = data?.emails || [];
  const paginationData = data?.pagination;
  const unreadCount = useMemo(() => {
    if (!data?.emails) return 0;
    return data.emails.filter((email) => !email.isRead).length;
  }, [data?.emails]);

  // Fetch single email details for dialog
  const { data: selectedEmailData, isLoading: isLoadingEmail } = useQuery<{ email: Email }>({
    queryKey: ['email-detail', selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null;
      const response = await apiClient.get(`/api/emails/${selectedEmailId}`);
      return response.data.data;
    },
    enabled: !!selectedEmailId && isDialogOpen,
  });

  // Mark email as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      await apiClient.put(`/api/emails/${emailId}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-detail'] });
    },
  });

  const handleViewEmail = useCallback(
    (email: Email) => {
      setSelectedEmailId(email.id);
      setIsDialogOpen(true);

      // Mark as read if unread
      if (!email.isRead) {
        markAsReadMutation.mutate(email.id);
      }
    },
    [markAsReadMutation]
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedEmailId(null);
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDef<Email>[]>(
    () => [
      {
        accessorKey: 'sender',
        header: 'Sender',
        cell: ({ row }) => {
          const email = row.original;
          const senderName = `${email.sender.firstName} ${email.sender.lastName}`;
          const isUnread = !email.isRead;

          return (
            <div className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 rounded-full p-2 ${
                  isUnread ? 'bg-blue-500 dark:bg-blue-600' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Mail className="h-4 w-4 text-white dark:text-blue-50" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{senderName}</p>
                  {isUnread && (
                    <Badge variant="default" className="h-4 px-1.5 text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{email.sender.email}</p>
              </div>
            </div>
          );
        },
        size: 250,
      },
      {
        accessorKey: 'subject',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Subject
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const email = row.original;
          return (
            <div className="max-w-md">
              <p className="text-sm font-semibold text-foreground truncate">
                {email.subject || '(No subject)'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {email.content.substring(0, 150)}
                {email.content.length > 150 ? '...' : ''}
              </p>
            </div>
          );
        },
        size: 350,
      },
      {
        accessorKey: 'case',
        header: 'Case',
        cell: ({ row }) => {
          const email = row.original;
          return email.case ? (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm truncate">{email.case.referenceNumber}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'sentAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Date
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
          const email = row.original;
          return (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(email.sentAt), 'MMM d, h:mm a')}</span>
            </div>
          );
        },
        size: 150,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const email = row.original;
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => handleViewEmail(email)}
            >
              View
            </Button>
          );
        },
        size: 100,
      },
    ],
    [handleViewEmail]
  );

  // Table instance with server-side pagination and sorting
  const table = useReactTable({
    data: emails,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: true, // Server-side pagination
    manualSorting: true, // Server-side sorting
    pageCount: paginationData ? paginationData.totalPages : 0,
    state: {
      sorting,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Received Emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SimpleSkeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Received Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Failed to load emails</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Received Emails</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Incoming emails and replies from clients
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails by subject or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={isReadFilter}
            onValueChange={(value: 'all' | 'read' | 'unread') => setIsReadFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by read status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All emails</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
              <SelectItem value="read">Read only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {emails.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="mx-auto h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">No received emails</p>
            <p className="text-xs mt-1">
              {searchQuery || isReadFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Client email replies will appear here'}
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
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                      const email = row.original;
                      const isUnread = !email.isRead;

                      return (
                        <TableRow
                          key={row.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            isUnread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                          onClick={() => handleViewEmail(email)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No emails found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {paginationData && paginationData.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
                  {Math.min((pagination.pageIndex + 1) * pagination.pageSize, paginationData.total)}{' '}
                  of {paginationData.total} emails
                </div>
                <div className="flex items-center gap-2">
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
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.pageIndex + 1} of {paginationData.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Email Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-2 pb-4 border-b">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-xl font-semibold pr-4">
                {isLoadingEmail
                  ? 'Loading email...'
                  : selectedEmailData?.email?.subject || 'Email Details'}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseDialog} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedEmailData?.email && (
              <DialogDescription className="text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(
                      new Date(selectedEmailData.email.sentAt),
                      'EEEE, MMMM d, yyyy at h:mm a'
                    )}
                  </span>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          {isLoadingEmail ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <SimpleSkeleton className="h-8 w-full" />
              <SimpleSkeleton className="h-20 w-full" />
              <SimpleSkeleton className="h-40 w-full" />
            </div>
          ) : selectedEmailData?.email ? (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Sender Info */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(
                        `${selectedEmailData.email.sender.firstName} ${selectedEmailData.email.sender.lastName}`
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">
                        {selectedEmailData.email.sender.firstName}{' '}
                        {selectedEmailData.email.sender.lastName}
                      </p>
                      {!selectedEmailData.email.isRead && (
                        <Badge variant="default" className="h-5 px-2 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmailData.email.sender.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>From client</span>
                    </div>
                  </div>
                </div>

                {/* Case Info */}
                {selectedEmailData.email.case && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        Related Case
                      </p>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {selectedEmailData.email.case.referenceNumber}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Email Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed p-4 bg-background rounded-lg border">
                    {selectedEmailData.email.content || '(No content)'}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  {selectedEmailData.email.isRead ? (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Read{' '}
                      {selectedEmailData.email.readAt &&
                        format(new Date(selectedEmailData.email.readAt), 'MMM d, h:mm a')}
                    </span>
                  ) : (
                    <span>Unread</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleCloseDialog();
                      // Navigate to messages page for reply
                      window.location.href = `/dashboard/messages?mode=email&messageId=${selectedEmailData.email.id}&clientId=${selectedEmailData.email.senderId}&clientName=${encodeURIComponent(`${selectedEmailData.email.sender.firstName} ${selectedEmailData.email.sender.lastName}`)}`;
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Failed to load email details</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
