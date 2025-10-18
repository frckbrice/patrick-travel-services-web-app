'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Mail, Phone, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { getInitials } from '@/lib/utils/helpers';

export interface ClientWithCases {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  casesCount: number;
  activeCases: number;
}

interface ClientsTableProps {
  data: ClientWithCases[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function ClientsTable({
  data,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  searchQuery,
  onSearchChange,
}: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Column definitions
  const columns = useMemo<ColumnDef<ClientWithCases>[]>(
    () => [
      {
        accessorKey: 'client',
        header: 'Client',
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {getInitials(`${client.firstName} ${client.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {client.firstName} {client.lastName}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {client.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => {
          const phone = row.original.phone;
          if (!phone) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <span className="text-sm flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {phone}
            </span>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'casesCount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Total Cases
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const count = row.original.casesCount;
          return <div className="text-center font-medium">{count}</div>;
        },
      },
      {
        accessorKey: 'activeCases',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Active Cases
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const active = row.original.activeCases;
          return (
            <div className="text-center">
              <Badge variant={active > 0 ? 'default' : 'secondary'}>{active}</Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Joined Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return <span className="text-sm text-muted-foreground">{date.toLocaleDateString()}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          return (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/clients/${row.original.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          );
        },
      },
    ],
    []
  );

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    // PERFORMANCE: Server-side pagination - don't paginate client-side
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
              Showing {data.length} of {totalItems} clients
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => onPageChange(page)}
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
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
    </div>
  );
}
