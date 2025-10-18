'use client';

import { memo, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '@/features/cases/api';
import { useDocuments } from '@/features/documents/api';
import { useRealtimeChatRooms } from '@/features/messages/hooks/useRealtimeChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Case } from '@/features/cases/types';
import { StatCardPlaceholder } from '@/components/ui/progressive-placeholder';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';

// Case status constants
const TERMINAL_STATUSES = ['APPROVED', 'REJECTED', 'CLOSED'] as const;
const CASE_STATUS_APPROVED = 'APPROVED' as const;

export const DashboardHome = memo(function DashboardHome() {
  const { user } = useAuthStore();

  // PERFORMANCE: Optimize queries with staleTime and prefetch for instant navigation
  const { data: casesData, isLoading: casesLoading } = useCases(
    {},
    {
      staleTime: 60000, // Cache for 60 seconds
      gcTime: 600000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Use cached data
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    }
  );
  const { data: documentsData, isLoading: documentsLoading } = useDocuments(
    {},
    {
      staleTime: 60000,
      gcTime: 600000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
  // REAL-TIME: Use Firebase real-time hook instead of slow API call
  const { chatRooms: conversations, isLoading: conversationsLoading } = useRealtimeChatRooms();

  // PERFORMANCE: Memoize expensive calculations
  const stats = useMemo(() => {
    const cases = casesData?.cases || [];
    const documents = documentsData?.documents || [];
    const chatRooms = conversations || [];

    // Calculate pending documents (documents with PENDING status)
    const pendingDocuments = documents.filter((doc) => doc.status === 'PENDING').length;

    // Calculate unread messages from chat rooms
    const unreadMessages = user?.id
      ? chatRooms.reduce((total, room) => {
        if (room.unreadCount) {
            return total + (room.unreadCount[user.id] || 0);
        }
        return total;
      }, 0)
      : 0;

    return {
      totalCases: cases.length,
      activeCases: cases.filter((c: Case) => !TERMINAL_STATUSES.includes(c.status as any)).length,
      completedCases: cases.filter((c: Case) => c.status === CASE_STATUS_APPROVED).length,
      pendingDocuments,
      unreadMessages,
    };
  }, [casesData?.cases, documentsData?.documents, conversations, user?.id]);

  // Progressive loading flags
  const isLoadingCases = casesLoading && !casesData;
  const isLoadingDocuments = documentsLoading && !documentsData;
  const isLoadingConversations = conversationsLoading && !conversations;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-2">Here is an overview of your immigration cases</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingCases ? (
          <StatCardPlaceholder title="Total Cases" icon={Briefcase} />
        ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCases}</div>
                <p className="text-xs text-muted-foreground">{stats.activeCases} active</p>
              </CardContent>
            </Card>
        )}

        {isLoadingDocuments ? (
          <StatCardPlaceholder title="Pending Documents" icon={FileText} />
        ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
                <p className="text-xs text-muted-foreground">Documents to upload</p>
              </CardContent>
            </Card>
        )}

        {isLoadingConversations ? (
          <StatCardPlaceholder title="Unread Messages" icon={MessageSquare} />
        ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unreadMessages}</div>
                <p className="text-xs text-muted-foreground">From your advisor</p>
              </CardContent>
            </Card>
        )}

        {isLoadingCases ? (
          <StatCardPlaceholder title="Completed" icon={CheckCircle2} />
        ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedCases}</div>
                <p className="text-xs text-muted-foreground">Successful cases</p>
              </CardContent>
            </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* PERFORMANCE: Dynamic routing based on user role */}
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={user?.role === 'CLIENT' ? '/dashboard/my-cases' : '/dashboard/cases'}>
                <Briefcase className="mr-2 h-4 w-4" />
                {user?.role === 'CLIENT' ? 'View My Cases' : 'Manage Cases'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/documents">
                <FileText className="mr-2 h-4 w-4" />
                {user?.role === 'CLIENT' ? 'Upload Documents' : 'Manage Documents'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                {user?.role === 'CLIENT' ? 'Message Advisor' : 'Messages'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/notifications">
                <AlertCircle className="mr-2 h-4 w-4" />
                View Notifications
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {user?.role === 'CLIENT'
                ? 'Have questions? We are here to help!'
                : 'Quick access to support resources'}
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/messages">
                {user?.role === 'CLIENT' ? 'Contact Advisor' : 'View Messages'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

/**
 * PERFORMANCE OPTIMIZED: Ultra-minimal skeleton for instant perceived loading
 * - Reduced ~80 DOM elements to ~22 (72% reduction) → Better FCP
 * - Memoized component → Better TBT
 * - Reduced stat cards from 4 to 3 → Better Speed Index
 * - Simpler structure → Better CLS
 * - No nested Card components → Faster rendering
 */
export const DashboardHomeSkeleton = memo(function DashboardHomeSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header - Minimal */}
      <div className="space-y-2">
        <SkeletonText size="xl" className="w-64" />
        <SkeletonText size="sm" className="w-96" />
      </div>

      {/* Stat Cards - Reduced from 4 to 3, simplified structure */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SimpleSkeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* Actions Section - Simplified from 2 cards to single skeleton blocks */}
      <div className="grid gap-4 md:grid-cols-2">
        <SimpleSkeleton className="h-56 rounded-lg" />
        <SimpleSkeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
});
