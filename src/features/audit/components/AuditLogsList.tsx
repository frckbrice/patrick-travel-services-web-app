'use client';

import { useAuthStore } from '@/features/auth/store';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search, Shield, Clock, User, AlertCircle, Info, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Future: This will be replaced with API data
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'USER' | 'SYSTEM' | 'SECURITY';
  ipAddress?: string;
  createdAt: string;
}

export function AuditLogsList() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    // Only ADMIN can access this page
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user?.role !== 'ADMIN') {
    return null;
  }

  // Normalize category filter for API (lowercase UI values → uppercase enum values)
  const normalizedCategory =
    categoryFilter === 'all'
      ? undefined
      : (categoryFilter.toUpperCase() as 'USER' | 'SYSTEM' | 'SECURITY');

  // Future: Fetch from API
  // const { data, isLoading } = useAuditLogs({ category: normalizedCategory, search: searchQuery });
  // For now, show informative empty state
  const isLoading = false;
  const logs: AuditLog[] = []; // Future: data?.logs || []

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'ERROR':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  if (isLoading) return <AuditLogsListSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <Shield className="inline-block mr-2 h-8 w-8 text-primary" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground mt-2">
          Track all system activities and changes for security and compliance
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="user">User Actions</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              Audit Logging - Backend Integration Required
            </h3>
            <p className="text-muted-foreground mb-2">
              {searchQuery || categoryFilter !== 'all'
                ? 'No logs match your filters'
                : 'The audit logging system is ready for backend integration'}
            </p>
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 max-w-2xl mx-auto text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Implementation Checklist:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Add AuditLog model to Prisma schema</li>
                <li>Create POST /api/audit-logs endpoint</li>
                <li>Create GET /api/audit-logs endpoint with filtering</li>
                <li>Add audit logging middleware to API routes</li>
                <li>Connect frontend to useAuditLogs() hook</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                See ADMIN_DASHBOARD_COMPREHENSIVE_AUDIT.md for detailed implementation guide
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(log.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium">
                          {log.action} on {log.entity}
                          {log.entityId && (
                            <span className="text-muted-foreground text-sm ml-2">
                              #{log.entityId}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{log.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          {log.ipAddress && (
                            <span className="text-xs font-mono">{log.ipAddress}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityBadgeColor(log.severity)}>
                          {log.severity}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditLogsListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[400px]" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
