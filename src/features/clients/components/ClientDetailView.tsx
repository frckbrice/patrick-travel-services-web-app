'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useClient, useClientCases } from '../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { SimpleSkeleton, SkeletonText, SkeletonCard } from '@/components/ui/simple-skeleton';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ClientDetailViewProps {
  clientId: string;
}

const statusConfig = {
  SUBMITTED: { color: 'bg-blue-100 text-blue-800', icon: FileText },
  UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  DOCUMENTS_REQUIRED: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: Clock },
  APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: client, isLoading: isLoadingClient, error: clientError } = useClient(clientId);
  const { data: cases, isLoading: isLoadingCases } = useClientCases(clientId);
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'AGENT' || user?.role === 'ADMIN';

  if (isLoadingClient) return <ClientDetailSkeleton />;

  if (clientError || !client) {
    // Check if it's a permission error (403)
    const isForbidden =
      clientError && 'response' in clientError && (clientError as any).response?.status === 403;

    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
        {isForbidden ? (
          <>
            <div>
              <p className="text-red-600 font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                You can only view profiles of clients with cases assigned to you.
              </p>
            </div>
          </>
        ) : (
          <p className="text-red-600">Client not found</p>
        )}
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const fullName = `${client.firstName} ${client.lastName}`.trim() || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
              <p className="text-muted-foreground">Client Profile</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/messages?client=${clientId}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={client.isActive ? 'default' : 'secondary'}>
                {client.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {client.isVerified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Verified
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cases Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {cases?.filter((c) => c.status === 'APPROVED').length || 0} approved
            </p>
          </CardContent>
        </Card>

        {/* Member Since Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(client.createdAt), 'MMM yyyy')}
            </div>
            <p className="text-xs text-muted-foreground">
              Last login:{' '}
              {client.lastLogin ? format(new Date(client.lastLogin), 'MMM dd, yyyy') : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Cases ({cases?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Client&apos;s contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email || 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{client.phone || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Account information and timestamps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{client.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <Badge variant="outline">{client.role}</Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(client.createdAt), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(client.updatedAt), 'PPpp')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          {isLoadingCases ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} className="h-32" />
              ))}
            </div>
          ) : !cases || cases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">No Cases Yet</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  This client hasn&apos;t submitted any cases yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => {
                const StatusIcon =
                  statusConfig[caseItem.status as keyof typeof statusConfig]?.icon || FileText;
                return (
                  <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <Link
                                href={`/dashboard/cases/${caseItem.id}`}
                                className="text-lg font-semibold hover:underline"
                              >
                                {caseItem.referenceNumber}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {caseItem.serviceType.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                statusConfig[caseItem.status as keyof typeof statusConfig]?.color
                              )}
                            >
                              {caseItem.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline">{caseItem.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(caseItem.submissionDate), 'MMM dd, yyyy')}
                            </div>
                            {caseItem.lastUpdated && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Updated {format(new Date(caseItem.lastUpdated), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/cases/${caseItem.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonText size="xl" className="w-64" />
          <SkeletonText size="sm" className="w-32" />
        </div>
        <SimpleSkeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <SimpleSkeleton className="h-10 w-full max-w-md" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}
