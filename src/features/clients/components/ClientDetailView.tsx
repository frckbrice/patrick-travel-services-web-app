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
import { useTranslation } from 'react-i18next';

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
  CLOSED: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const { t } = useTranslation();
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
              <p className="text-red-600 font-semibold">{t('clients.accessDenied')}</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                {t('clients.canOnlyViewAssignedClients')}
              </p>
            </div>
          </>
        ) : (
          <p className="text-red-600">{t('clients.clientNotFound')}</p>
        )}
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-transparent hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.goBack')}
        </Button>
      </div>
    );
  }

  const fullName = `${client.firstName} ${client.lastName}`.trim() || t('clients.notAvailable');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0 bg-transparent hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight wrap-break-word">
                {fullName}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('clients.clientProfile')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/messages?client=${clientId}`)}
            className="bg-transparent hover:bg-muted/80 transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('clients.message')}
          </Button>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {/* Status Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('clients.status')}
            </span>
            <CheckCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={client.isActive ? 'default' : 'secondary'} className="text-xs">
              {client.isActive ? t('clients.active') : t('clients.inactive')}
            </Badge>
            {client.isVerified && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 text-xs"
              >
                {t('clients.verified')}
              </Badge>
            )}
          </div>
        </Card>

        {/* Cases Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('clients.totalCases')}
            </span>
            <Briefcase className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold">{cases?.length || 0}</span>
            <span className="text-xs text-muted-foreground truncate">
              {cases?.filter((c) => c.status === 'APPROVED').length || 0} {t('clients.approved')}
            </span>
          </div>
        </Card>

        {/* Member Since Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('clients.memberSince')}
            </span>
            <Calendar className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold">
              {format(new Date(client.createdAt), 'MMM yyyy')}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {t('clients.last')}:{' '}
              {client.lastLogin ? format(new Date(client.lastLogin), 'MMM dd') : t('clients.never')}
            </span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          // Client-side tab switching - no page reload
          setActiveTab(value);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-muted/50 p-1">
          <TabsTrigger
            value="overview"
            type="button"
            className="bg-transparent hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap transition-colors text-xs sm:text-sm"
          >
            {t('clients.overview')}
          </TabsTrigger>
          <TabsTrigger
            value="cases"
            type="button"
            className="bg-transparent hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap transition-colors text-xs sm:text-sm"
          >
            {t('cases.title')} ({cases?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('clients.contactInformation')}</CardTitle>
              <CardDescription>{t('clients.contactDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('clients.email')}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.email || t('clients.notAvailable')}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('clients.phone')}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.phone || t('clients.notAvailable')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('clients.accountDetails')}</CardTitle>
              <CardDescription>{t('clients.accountInformation')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('clients.userID')}</p>
                    <p className="text-sm text-muted-foreground font-mono">{client.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('clients.role')}</p>
                    <Badge variant="outline">{client.role}</Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">{t('clients.createdAt')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(client.createdAt), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('clients.lastUpdated')}</p>
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
                <p className="text-base sm:text-lg font-semibold mb-2">{t('clients.noCasesYet')}</p>
                <p className="text-sm sm:text-base text-muted-foreground text-center max-w-sm leading-relaxed">
                  {t('clients.thisClientHasNoCases')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cases.map((caseItem) => {
                const StatusIcon =
                  statusConfig[caseItem.status as keyof typeof statusConfig]?.icon || FileText;
                return (
                  <Card
                    key={caseItem.id}
                    className="hover:shadow-md transition-shadow border shadow-sm"
                  >
                    <CardContent className="p-4 sm:p-6">
                      {/* Mobile: Stacked layout, Desktop: Side by side */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-3 flex-1 min-w-0">
                          {/* Header: Reference and Service Type */}
                          <div className="flex items-start gap-3">
                            <StatusIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/dashboard/cases/${caseItem.id}`}
                                className="text-base sm:text-lg font-semibold hover:underline block mb-1 truncate"
                              >
                                {caseItem.referenceNumber}
                              </Link>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {t(`cases.serviceLabels.${caseItem.serviceType}`) ||
                                  caseItem.serviceType.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>

                          {/* Badges: Status and Priority */}
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs whitespace-nowrap',
                                statusConfig[caseItem.status as keyof typeof statusConfig]?.color
                              )}
                            >
                              {t(`cases.statusLabels.${caseItem.status}`) ||
                                caseItem.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {t(`cases.priorityLabels.${caseItem.priority}`) || caseItem.priority}
                            </Badge>
                          </div>

                          {/* Dates: Mobile stacked, Desktop inline */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {format(new Date(caseItem.submissionDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            {caseItem.lastUpdated && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {t('clients.updated')}{' '}
                                  {format(new Date(caseItem.lastUpdated), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="bg-black text-white hover:bg-black/90 hover:text-white border-black transition-colors w-full sm:w-auto"
                          >
                            <Link href={`/dashboard/cases/${caseItem.id}`}>
                              {t('clients.viewCase')}
                            </Link>
                          </Button>
                        </div>
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
      <div className="grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-20" />
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
