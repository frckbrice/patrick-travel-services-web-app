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

  // For ADMIN: show all cases. For AGENT: show only assigned cases
  const assignedCases = useMemo(() => {
    if (!user?.id || !cases.length) return [];

    // ADMIN sees all cases in the system
    if (user.role === 'ADMIN') {
      return cases;
    }

    // AGENT sees only their assigned cases
    return cases.filter((c: Case) => {
      const assignedId = c.assignedAgentId;
      return assignedId && assignedId === user.id;
    });
  }, [cases, user?.id, user?.role]);

  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  const activeAssigned = useMemo(() => {
    return assignedCases.filter((c: Case) => {
      const status = String(c.status || '').toUpperCase();
      return !['APPROVED', 'REJECTED', 'CLOSED'].includes(status);
    });
  }, [assignedCases]);

  const completedThisMonth = useMemo(() => {
    return assignedCases.filter((c: Case) => {
      // Check status more robustly
      const status = String(c.status || '').toUpperCase();
      if (status !== 'APPROVED') return false;

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

  const stats = useMemo(() => {
    const pendingReviewCount = assignedCases.filter((c: Case) => {
      const status = String(c.status || '').toUpperCase();
      return status === 'UNDER_REVIEW' || status === 'UNDERREVIEW';
    }).length;

    return {
      assignedCases: assignedCases.length,
      activeCases: activeAssigned.length,
      completedThisMonth: completedThisMonth.length,
      pendingReview: pendingReviewCount,
      documentsToVerify,
      responseTime,
    };
  }, [assignedCases, activeAssigned, completedThisMonth, documentsToVerify, responseTime]);

  // PERFORMANCE: Only show skeleton if NO data is cached (first load)
  // NOW safe to do conditional returns after all hooks have been called
  const isFirstLoad = isLoading && !casesData;
  if (isFirstLoad) return <AgentDashboardSkeleton />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.role === 'ADMIN' ? 'Dashboard overview' : 'Your cases overview'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {user?.role === 'ADMIN' ? 'All Cases' : 'Assigned Cases'}
            </span>
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.assignedCases}</span>
            <span className="text-xs text-muted-foreground">{stats.activeCases} active</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {user?.role === 'ADMIN' ? 'Under Review' : 'Pending Review'}
            </span>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.pendingReview}</span>
            <span className="text-xs text-muted-foreground">Require attention</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.completedThisMonth}</span>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Response Time</span>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.responseTime}</span>
            <span className="text-xs text-muted-foreground">Average</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <div className="p-4 pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Recent Cases</CardTitle>
          </div>
          <div className="p-3 space-y-2">
            {activeAssigned.slice(0, 5).map((c: Case) => (
              <div key={c.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.referenceNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.client?.firstName} {c.client?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href={`/dashboard/cases/${c.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))}
            {activeAssigned.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Briefcase className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">
                  {user?.role === 'ADMIN' ? 'No active cases' : 'No active cases assigned'}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="col-span-3">
          <div className="p-4 pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </div>
          <div className="p-3 space-y-1.5">
            <Button asChild className="w-full justify-start h-8 text-sm" variant="outline">
              <Link href="/dashboard/cases">
                <Briefcase className="mr-2 h-3.5 w-3.5" />
                {user?.role === 'ADMIN' ? 'All Cases' : 'My Cases'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start h-8 text-sm" variant="outline">
              <Link href="/dashboard/documents">
                <FileCheck className="mr-2 h-3.5 w-3.5" />
                {user?.role === 'ADMIN' ? 'All Documents' : 'Review Documents'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start h-8 text-sm" variant="outline">
              <Link href="/dashboard/clients">
                <Users className="mr-2 h-3.5 w-3.5" />
                {user?.role === 'ADMIN' ? 'All Clients' : 'My Clients'}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start h-8 text-sm" variant="outline">
              <Link href="/dashboard/messages">
                <AlertCircle className="mr-2 h-3.5 w-3.5" />
                {user?.role === 'ADMIN' ? 'All Messages' : 'Urgent Messages'}
              </Link>
            </Button>
          </div>
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
