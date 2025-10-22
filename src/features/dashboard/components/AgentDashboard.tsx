'use client';

import { memo, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '@/features/cases/api';
import { Case } from '@/features/cases/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { StatCardPlaceholder, ListItemPlaceholder } from '@/components/ui/progressive-placeholder';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';

export const AgentDashboard = memo(function AgentDashboard() {
  const { user } = useAuthStore();

  // PERFORMANCE: Add caching and prevent refetch for instant navigation
  const { data: casesData, isLoading } = useCases(
    {},
    {
      staleTime: 60000, // Cache for 60 seconds
      gcTime: 600000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Use cached data
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    }
  );

  const cases: Case[] = casesData?.cases || [];
  const assignedCases = user?.id ? cases.filter((c: Case) => c.assignedAgentId === user.id) : [];

  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  const activeAssigned = useMemo(() => {
    return assignedCases.filter(
      (c: Case) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status)
    );
  }, [assignedCases]);

  const completedThisMonth = useMemo(() => {
    return assignedCases.filter((c: Case) => {
      if (c.status !== 'APPROVED') return false;

      // Use dedicated completion timestamp: completedAt or approvedAt, fallback to lastUpdated
      const completionTimestamp = c.completedAt || c.approvedAt || c.lastUpdated;
      if (!completionTimestamp) return false;

      const completedDate = new Date(completionTimestamp);
      // Guard against invalid dates
      if (isNaN(completedDate.getTime())) return false;

      const now = new Date();
      return (
        completedDate.getMonth() === now.getMonth() &&
        completedDate.getFullYear() === now.getFullYear()
      );
    });
  }, [assignedCases]);

  // Calculate documents requiring verification (PENDING status)
  const documentsToVerify = useMemo(() => {
    return assignedCases.reduce((count: number, c: Case) => {
      if (c.documents && Array.isArray(c.documents)) {
        return count + c.documents.filter((doc) => doc.status === 'PENDING').length;
      }
      return count;
    }, 0);
  }, [assignedCases]);

  // Calculate average response time
  const responseTime = useMemo(() => {
    // Filter cases that have been updated after submission (excluding just-submitted cases)
    const processedCases = assignedCases.filter((c: Case) => {
      if (!c.submissionDate || !c.lastUpdated) return false;

      const submitted = new Date(c.submissionDate);
      const updated = new Date(c.lastUpdated);

      // Guard against invalid dates
      if (isNaN(submitted.getTime()) || isNaN(updated.getTime())) return false;

      return updated.getTime() - submitted.getTime() > 60000; // More than 1 minute difference
    });

    if (processedCases.length === 0) return 'N/A';

    // Calculate average time difference in milliseconds
    const totalResponseTime = processedCases.reduce((total: number, c: Case) => {
      const submitted = new Date(c.submissionDate);
      const updated = new Date(c.lastUpdated);
      return total + (updated.getTime() - submitted.getTime());
    }, 0);

    const avgResponseTimeMs = totalResponseTime / processedCases.length;
    const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

    // Format the response time
    if (avgResponseTimeHours < 1) {
      const minutes = Math.round(avgResponseTimeMs / (1000 * 60));
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else if (avgResponseTimeHours < 24) {
      return `${avgResponseTimeHours.toFixed(1)} hrs`;
    } else {
      const days = avgResponseTimeHours / 24;
      return `${days.toFixed(1)} days`;
    }
  }, [assignedCases]);

  const stats = useMemo(
    () => ({
      assignedCases: assignedCases.length,
      activeCases: activeAssigned.length,
      completedThisMonth: completedThisMonth.length,
      pendingReview: assignedCases.filter((c: Case) => c.status === 'UNDER_REVIEW').length,
      documentsToVerify,
      responseTime,
    }),
    [assignedCases, activeAssigned, completedThisMonth, documentsToVerify, responseTime]
  );

  // PERFORMANCE: Only show skeleton if NO data is cached (first load)
  // NOW safe to do conditional returns after all hooks have been called
  const isFirstLoad = isLoading && !casesData;
  if (isFirstLoad) return <AgentDashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-2">Here is your agent dashboard overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedCases}</div>
            <p className="text-xs text-muted-foreground">{stats.activeCases} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed (This Month)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseTime}</div>
            <p className="text-xs text-muted-foreground">
              {stats.responseTime === 'N/A' ? 'No data available' : 'Average across all cases'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAssigned.slice(0, 5).map((c: Case) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{c.referenceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.client?.firstName} {c.client?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{c.status.replace(/_/g, ' ')}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/cases/${c.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))}
            {activeAssigned.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No active cases assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/cases">
                <Briefcase className="mr-2 h-4 w-4" />
                {user?.role === 'ADMIN' ? 'All Cases' : 'My Cases'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/documents">
                <FileCheck className="mr-2 h-4 w-4" />
                {user?.role === 'ADMIN' ? 'All Documents' : 'Review Documents'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/clients">
                <Users className="mr-2 h-4 w-4" />
                {user?.role === 'ADMIN' ? 'All Clients' : 'My Clients'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/messages">
                <AlertCircle className="mr-2 h-4 w-4" />
                {user?.role === 'ADMIN' ? 'All Messages' : 'Urgent Messages'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

/**
 * PERFORMANCE OPTIMIZED: Progressive skeleton with real structure
 * - Shows stat cards immediately with placeholder values
 * - Better perceived performance than empty skeletons
 * - Mobile-optimized for instant display
 */
export function AgentDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText size="xl" className="w-64" />
        <SkeletonText size="sm" className="w-96" />
      </div>

      {/* Stat Cards with Progressive Placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardPlaceholder title="Assigned Cases" icon={Briefcase} />
        <StatCardPlaceholder title="Pending Review" icon={Clock} />
        <StatCardPlaceholder title="Completed (This Month)" icon={CheckCircle2} />
        <StatCardPlaceholder title="Avg Response Time" icon={TrendingUp} />
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Cases Card */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <ListItemPlaceholder key={i} showBadge showActions />
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <SimpleSkeleton key={i} className="h-10 w-full rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
