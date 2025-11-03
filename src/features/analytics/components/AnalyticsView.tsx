'use client';

import { useAuthStore } from '@/features/auth/store';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCases } from '@/features/cases/api';
import { Case } from '@/features/cases/types';
import { BarChart3, TrendingUp, FileCheck, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function AnalyticsView() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading } = useCases({});

  useEffect(() => {
    // Only ADMIN and AGENT can access this page
    if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
    return null;
  }

  if (isLoading) return <AnalyticsViewSkeleton />;

  const cases: Case[] = data?.cases || [];
  const totalCases = cases.length;
  const activeCases = cases.filter(
    (c: Case) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status)
  ).length;
  const approvedCases = cases.filter((c: Case) => c.status === 'APPROVED').length;
  const successRate = totalCases > 0 ? Math.round((approvedCases / totalCases) * 100) : 0;

  // Calculate analytics data for charts
  const statusData = useMemo(() => {
    const statusCounts = cases.reduce(
      (acc, c) => {
        const status = c.status || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      value: count,
    }));
  }, [cases]);

  const serviceTypeData = useMemo(() => {
    const typeCounts = cases.reduce(
      (acc, c) => {
        const type = c.serviceType || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      value: count,
    }));
  }, [cases]);

  const monthlyTrends = useMemo(() => {
    const monthCounts: Record<string, number> = {};

    cases.forEach((c) => {
      const date = new Date(c.submissionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [cases]);

  const stats = [
    {
      label: 'Total Cases',
      value: totalCases.toString(),
      icon: BarChart3,
      description: 'All time cases',
    },
    {
      label: 'Active Cases',
      value: activeCases.toString(),
      icon: TrendingUp,
      description: 'Currently processing',
    },
    {
      label: 'Approved Cases',
      value: approvedCases.toString(),
      icon: FileCheck,
      description: 'Successfully approved',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      icon: Target,
      description: 'Approval percentage',
    },
  ];

  // Color palette for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Track performance and case statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="types">Case Types</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cases by Status</CardTitle>
              <CardDescription>Distribution of cases across different statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Case volume and approval trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Types Distribution</CardTitle>
              <CardDescription>Breakdown by visa type</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) =>
                        `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AnalyticsViewSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
