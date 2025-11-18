'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/features/users/api';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientsTable } from './ClientsTable';
import { useTranslation } from 'react-i18next';

export function ClientsList() {
  const { t } = useTranslation();
  const { user, isLoading: isAuthLoading, accessToken } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Table can show more items efficiently than cards

  // PERFORMANCE FIX: Server-side pagination + case counts - only fetch what we need
  const shouldFetchData =
    !isAuthLoading && !!user && !!accessToken && (user.role === 'ADMIN' || user.role === 'AGENT');

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers(
    {
      role: 'CLIENT',
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery || undefined,
      includeCaseCounts: true, // PERFORMANCE: Get case counts from server
    },
    { enabled: shouldFetchData }
  );

  // PERFORMANCE: Data already includes case counts from server - no client-side filtering needed
  const clientsWithCases = usersData?.users || [];
  const pagination = usersData?.pagination;
  const totalPages = pagination?.totalPages || 1;

  useEffect(() => {
    // Only ADMIN and AGENT can access this page
    if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // CONDITIONAL RENDERING: After all hooks have been called
  if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
    return null;
  }

  // Handle errors from data fetching
  if (usersError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            {t('clients.failedToLoadClients')}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t('clients.unableToLoadClientData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingUsers) return <ClientsListSkeleton />;

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <span className="wrap-break-word">
              {user?.role === 'AGENT' ? t('clients.myClients') : t('clients.allClients')}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            {user?.role === 'AGENT'
              ? t('clients.clientsWithCasesAssigned')
              : t('clients.manageAllClientAccounts')}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 w-fit shrink-0"
        >
          {pagination?.total || 0}{' '}
          {pagination?.total === 1 ? t('clients.client') : t('clients.clients_plural')}
        </Badge>
      </div>

      {/* Clients Table */}
      {clientsWithCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {searchQuery ? t('clients.noClientsFound') : t('clients.noClientsYet')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {searchQuery ? t('clients.tryAdjustingSearch') : t('clients.clientsWillAppear')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ClientsTable
          data={clientsWithCases}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pagination?.total || 0}
          onPageChange={setCurrentPage}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
      )}
    </div>
  );
}

export function ClientsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Search skeleton */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full max-w-sm" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex gap-4 pb-3 border-b">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
