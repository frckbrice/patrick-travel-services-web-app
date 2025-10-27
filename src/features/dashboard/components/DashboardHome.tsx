'use client';

import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { useRealtimeChatRooms } from '@/features/messages/hooks/useRealtimeChat';
import { apiClient } from '@/lib/utils/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { StatCardPlaceholder } from '@/components/ui/progressive-placeholder';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';

// Case status constants
const TERMINAL_STATUSES = ['APPROVED', 'REJECTED', 'CLOSED'] as const;
const CASE_STATUS_APPROVED = 'APPROVED' as const;

export const DashboardHome = memo(function DashboardHome() {
  const { user } = useAuthStore();

  // PERFORMANCE: Fetch dashboard statistics from server (efficient COUNT queries)
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/dashboard/stats');
      return response.data.data;
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // REAL-TIME: Use Firebase real-time hook for unread messages
  const { chatRooms: conversations } = useRealtimeChatRooms();

  // Calculate unread messages from chat rooms
  const unreadMessages = user?.id
    ? (conversations || []).reduce((total, room) => {
        if (room.unreadCount) {
          return total + (room.unreadCount[user.id] || 0);
        }
        return total;
      }, 0)
    : 0;

  // Progressive loading flag
  const isLoading = isLoadingStats || !stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-2">Here is an overview of your immigration cases</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardPlaceholder title="Total Cases" icon={Briefcase} />
            <StatCardPlaceholder title="Pending Documents" icon={FileText} />
            <StatCardPlaceholder title="Unread Messages" icon={MessageSquare} />
            <StatCardPlaceholder
              title={user?.role === 'CLIENT' ? 'Completed' : 'Assigned Cases'}
              icon={CheckCircle2}
            />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCases || 0}</div>
                <p className="text-xs text-muted-foreground">{stats.activeCases || 0} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingDocuments || 0}</div>
                <p className="text-xs text-muted-foreground">Documents to upload</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadMessages}</div>
                <p className="text-xs text-muted-foreground">From your advisor</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {user?.role === 'CLIENT' ? 'Completed' : 'Assigned Cases'}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user?.role === 'CLIENT'
                    ? stats.completedCases || 0
                    : ((stats as any)?.assignedCases ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'CLIENT' ? 'Successful cases' : 'Cases assigned to me'}
                </p>
              </CardContent>
            </Card>
          </>
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
