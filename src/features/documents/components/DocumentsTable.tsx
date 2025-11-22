'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useDocuments } from '../api';
import type { Document } from '../types';
import { DocumentStatus } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Trash2,
  User,
  Briefcase,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/utils/logger';

const getStatusConfig = (t: any) => ({
  PENDING: {
    label: t('documents.pending'),
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  APPROVED: {
    label: t('documents.approved'),
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  REJECTED: {
    label: t('documents.rejected'),
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
});

const getDocTypeLabels = (t: any) => ({
  PASSPORT: t('documents.types.PASSPORT'),
  ID_CARD: t('documents.types.ID_CARD'),
  BIRTH_CERTIFICATE: t('documents.types.BIRTH_CERTIFICATE'),
  MARRIAGE_CERTIFICATE: t('documents.types.MARRIAGE_CERTIFICATE'),
  DIPLOMA: t('documents.types.DIPLOMA'),
  EMPLOYMENT_LETTER: t('documents.types.EMPLOYMENT_LETTER'),
  BANK_STATEMENT: t('documents.types.BANK_STATEMENT'),
  PROOF_OF_RESIDENCE: t('documents.types.PROOF_OF_RESIDENCE'),
  PHOTO: t('documents.types.PHOTO'),
  OTHER: t('documents.types.OTHER'),
});

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

interface ClientDocumentsGroup {
  clientId: string;
  clientName: string;
  documentCount: number;
  pendingCount: number;
  documents: Document[];
}

export function DocumentsTable() {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const docTypeLabels = getDocTypeLabels(t);
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState<'client' | 'case'>('client');
  const [casePage, setCasePage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<ClientDocumentsGroup | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const itemsPerPage = 10;

  // Client grouping uses full dataset (existing behavior)
  const {
    data: clientData,
    isLoading: isLoadingClient,
    error: errorClient,
  } = useDocuments(
    {},
    {
      enabled: groupBy === 'client',
    }
  );

  // Case grouping uses server-side pagination (incremental enhancement)
  const {
    data: caseData,
    isLoading: isLoadingCase,
    error: errorCase,
  } = useDocuments(
    { page: casePage, limit: itemsPerPage },
    {
      enabled: groupBy === 'case',
    }
  );

  // Group documents by client
  const clientGroups = useMemo(() => {
    const documents: Document[] = clientData?.documents || [];
    const groups = new Map<string, ClientDocumentsGroup>();

    documents.forEach((doc) => {
      // Skip documents without client info
      if (!doc.uploadedBy) {
        logger.warn('Document missing uploadedBy data:', { docId: doc.id });
        return;
      }

      const clientId = doc.uploadedById;
      const clientName = `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`.trim();

      if (!groups.has(clientId)) {
        groups.set(clientId, {
          clientId,
          clientName,
          documentCount: 0,
          pendingCount: 0,
          documents: [],
        });
      }

      const group = groups.get(clientId)!;
      group.documentCount++;
      if (doc.status === DocumentStatus.PENDING) group.pendingCount++;
      group.documents.push(doc);
    });

    // Sort each group's documents by upload date (newest first)
    groups.forEach((group) => {
      group.documents.sort(
        (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    });

    // Convert to array and sort by latest upload date
    return Array.from(groups.values()).sort((a, b) => {
      const aLatest = a.documents[0]?.uploadDate || '';
      const bLatest = b.documents[0]?.uploadDate || '';
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
  }, [clientData?.documents]);

  // Filter and search
  const filteredGroups = useMemo(() => {
    let filtered = clientGroups;

    // Search by client name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((group) => group.clientName.toLowerCase().includes(query));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((group) =>
        group.documents.some((doc) => doc.status === statusFilter)
      );
    }

    return filtered;
  }, [clientGroups, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleView = (doc: Document) => {
    // Validate URL before opening
    try {
      logger.info('Attempting to view document (agent)', {
        filePath: doc.filePath,
        documentId: doc.id,
      });

      if (!doc.filePath) {
        logger.error('Document filePath is empty (agent)', { documentId: doc.id });
        toast.error(t('documents.invalidDocumentUrl'));
        return;
      }

      let fileUrl = doc.filePath;

      // If it's not a full URL, add https://
      if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        logger.warn('Document filePath is not a full URL (agent), adding https://', {
          filePath: doc.filePath,
        });
        fileUrl = `https://${fileUrl}`;
      }

      logger.info('Constructed file URL (agent)', { fileUrl });

      const url = new URL(fileUrl);
      const trustedDomains = ['utfs.io', 'uploadthing.com', 'ufs.sh', 'res.cloudinary.com'];
      const isTrusted = trustedDomains.some(
        (domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)
      );

      if (!isTrusted) {
        logger.warn('Document URL is not from trusted domain (agent)', {
          hostname: url.hostname,
          fileUrl,
        });
        toast.error(t('documents.invalidDocumentUrl'));
        return;
      }

      logger.info('Opening document in new tab (agent)', { fileUrl });
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      logger.error('Failed to open document (agent)', error, {
        filePath: doc.filePath,
        documentId: doc.id,
      });
      toast.error(t('documents.invalidDocumentUrl'));
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      logger.info('Starting document download (agent)', {
        filePath: doc.filePath,
        documentId: doc.id,
        originalName: doc.originalName,
      });

      // Fetch the file as a blob
      const response = await fetch(doc.filePath);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create a local blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.originalName || 'document';
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      logger.info('Document downloaded successfully (agent)', {
        documentId: doc.id,
        originalName: doc.originalName,
      });
    } catch (error) {
      logger.error('Failed to download document (agent)', error, {
        documentId: doc.id,
        filePath: doc.filePath,
      });
      toast.error(t('documents.downloadFailed'));
    }
  };

  const openClientDocuments = (group: ClientDocumentsGroup) => {
    setSelectedClient(group);
    setClientDialogOpen(true);
  };

  const isClient = user?.role === 'CLIENT';

  // Loading states per mode
  if ((groupBy === 'client' && isLoadingClient) || (groupBy === 'case' && isLoadingCase)) {
    return <DocumentsTableSkeleton />;
  }

  // Error states per mode
  if ((groupBy === 'client' && errorClient) || (groupBy === 'case' && errorCase)) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('documents.errorLoadingShort')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight wrap-break-word">
          {t('documents.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
          {isClient
            ? t('documents.manageDocuments')
            : user?.role === 'ADMIN'
              ? t('documents.reviewAllDocuments')
              : t('documents.reviewAssignedDocuments')}
        </p>
      </div>

      {/* Grouping + Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Tabs
                value={groupBy}
                onValueChange={(v) => {
                  // Prevent any default behavior and update filter client-side
                  const next = (v as 'client' | 'case') || 'client';
                  setGroupBy(next);
                  setCurrentPage(1); // Reset pagination when switching views
                  setCasePage(1);
                }}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="client" type="button" className="text-xs sm:text-sm">
                    {t('documents.groupByClient')}
                  </TabsTrigger>
                  <TabsTrigger value="case" type="button" className="text-xs sm:text-sm">
                    {t('documents.groupByCase')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    groupBy === 'client'
                      ? t('documents.searchByClient')
                      : t('documents.searchByCaseOrClient')
                  }
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                    setCasePage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  // Client-side filtering - no page reload
                  setStatusFilter(value);
                  setCurrentPage(1);
                  setCasePage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('documents.allStatus')}</SelectItem>
                  <SelectItem value={DocumentStatus.PENDING}>{t('documents.pending')}</SelectItem>
                  <SelectItem value={DocumentStatus.APPROVED}>{t('documents.approved')}</SelectItem>
                  <SelectItem value={DocumentStatus.REJECTED}>{t('documents.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client grouping table (existing behavior with client-side pagination) */}
      {groupBy === 'client' &&
        (filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t('documents.noDocumentsFound')}</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? t('documents.adjustFilters')
                  : t('documents.noDocumentsUploaded')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('documents.client')}</TableHead>
                      <TableHead>{t('documents.totalDocuments')}</TableHead>
                      <TableHead>{t('documents.pendingReview')}</TableHead>
                      <TableHead>{t('documents.latestUpload')}</TableHead>
                      <TableHead className="text-right">{t('documents.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedGroups.map((group) => {
                      const latestDoc = group.documents[0];
                      return (
                        <TableRow key={group.clientId}>
                          <TableCell>
                            <button
                              onClick={() => openClientDocuments(group)}
                              className="flex items-center gap-2 hover:underline text-left"
                            >
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{group.clientName}</span>
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {t('documents.documentsUploaded', {
                                count: group.documentCount,
                                type:
                                  group.documentCount === 1
                                    ? t('documents.document')
                                    : t('documents.documents_plural'),
                              })}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {group.pendingCount > 0 ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                {t('documents.pendingCount', { count: group.pendingCount })}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t('documents.none')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {latestDoc
                              ? new Date(latestDoc.uploadDate).toLocaleDateString()
                              : t('documents.nA')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <DropdownMenu>
                                <TooltipTrigger asChild>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openClientDocuments(group)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('documents.viewDocuments')}
                                  </DropdownMenuItem>
                                  {/* Link to most recent case */}
                                  {group.documents[0]?.case && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/cases/${group.documents[0].caseId}`}>
                                        <Briefcase className="mr-2 h-4 w-4" />
                                        {t('documents.viewLatestCase')}
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <TooltipContent>
                                <p>{t('documents.viewClientDocumentsCase')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Client grouping pagination */}
      {groupBy === 'client' && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('documents.showing', {
              from: (currentPage - 1) * itemsPerPage + 1,
              to: Math.min(currentPage * itemsPerPage, filteredGroups.length),
              total: filteredGroups.length,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm px-2">
                {t('documents.page', { current: currentPage, total: totalPages })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Case grouping table with server-side pagination */}
      {groupBy === 'case' && (
        <Card>
          <CardContent className="p-0">
            {(() => {
              const allDocs: Document[] = (caseData?.documents || []).filter((doc) => {
                // Apply simple client-side filters for status and query (kept minimal)
                const statusOk = statusFilter === 'all' || doc.status === statusFilter;
                if (!searchQuery) return statusOk;
                const q = searchQuery.toLowerCase();
                const clientName =
                  `${doc.uploadedBy?.firstName || ''} ${doc.uploadedBy?.lastName || ''}`.toLowerCase();
                const caseRef = doc.case?.referenceNumber?.toLowerCase() || '';
                const fileName = (doc.originalName || '').toLowerCase();
                return (
                  statusOk &&
                  (clientName.includes(q) || caseRef.includes(q) || fileName.includes(q))
                );
              });
              const pagination = (caseData as any)?.pagination;
              const total = pagination?.total || allDocs.length;
              const totalPagesServer = pagination?.totalPages || Math.ceil(total / itemsPerPage);

              return (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('documents.document')}</TableHead>
                          <TableHead>{t('documents.client')}</TableHead>
                          <TableHead>{t('documents.caseRef')}</TableHead>
                          <TableHead>{t('documents.status')}</TableHead>
                          <TableHead>{t('documents.uploaded')}</TableHead>
                          <TableHead className="text-right">{t('documents.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allDocs.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              {t('documents.noDocumentsFound')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          allDocs.map((doc) => {
                            const StatusIcon = statusConfig[doc.status]?.icon || Clock;
                            const clientName =
                              `${doc.uploadedBy?.firstName || ''} ${doc.uploadedBy?.lastName || ''}`.trim();
                            return (
                              <TableRow key={doc.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium truncate">{doc.originalName}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {docTypeLabels[doc.documentType]} •{' '}
                                    {formatFileSize(doc.fileSize)}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {clientName || t('documents.unknownClient')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {doc.case ? (
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        {doc.case.referenceNumber}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      'flex items-center gap-1',
                                      statusConfig[doc.status]?.className
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig[doc.status]?.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleView(doc)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      {t('documents.view')}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownload(doc)}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      {t('documents.download')}
                                    </Button>
                                    {doc.case && (
                                      <Button variant="default" size="sm" asChild>
                                        <Link href={`/dashboard/cases/${doc.caseId}`}>
                                          <Briefcase className="h-4 w-4 mr-1" />
                                          {t('documents.viewCase')}
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Server-side pagination */}
                  {totalPagesServer > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        {t('documents.page', { current: casePage, total: totalPagesServer })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCasePage((p) => Math.max(1, p - 1))}
                          disabled={casePage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCasePage((p) => p + 1)}
                          disabled={casePage >= totalPagesServer}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Client Documents Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('documents.clientDocuments', { name: selectedClient?.clientName })}
            </DialogTitle>
            <DialogDescription>
              {t('documents.documentsUploaded', {
                count: selectedClient?.documentCount || 0,
                type:
                  selectedClient?.documentCount === 1
                    ? t('documents.document')
                    : t('documents.documents_plural'),
              })}
              {selectedClient && selectedClient.pendingCount > 0 && (
                <span className="text-yellow-600">
                  {' '}
                  • {t('documents.pendingReviewCount', { count: selectedClient.pendingCount })}
                </span>
              )}
              <br />
              <span className="text-xs">{t('documents.approveRejectHint')}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedClient?.documents.map((doc) => {
              const StatusIcon = statusConfig[doc.status]?.icon || Clock;
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <h4 className="font-medium truncate">{doc.originalName}</h4>
                          <Badge
                            className={cn(
                              'flex items-center gap-1',
                              statusConfig[doc.status]?.className
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[doc.status]?.label}
                          </Badge>
                        </div>

                        {doc.case && (
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-primary">
                              {doc.case.referenceNumber}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {docTypeLabels[doc.documentType]} • {formatFileSize(doc.fileSize)} •{' '}
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>

                        {doc.status === 'APPROVED' && doc.verifiedBy && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {t('documents.verifiedBy')} {doc.verifiedBy}
                          </p>
                        )}

                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <div className="flex gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <p className="text-xs text-red-600">{doc.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                              <Eye className="h-4 w-4 mr-1" />
                              {t('documents.view')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open document in new tab</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-1" />
                              {t('documents.download')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download document to your device</p>
                          </TooltipContent>
                        </Tooltip>
                        {/* Go to case to approve/reject - single source of truth */}
                        {doc.case && (
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/dashboard/cases/${doc.caseId}`}>
                              <Briefcase className="h-4 w-4 mr-1" />
                              {t('documents.viewCase')}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentsTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText size="xl" className="w-48" />
        <SkeletonText size="sm" className="w-96" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <SimpleSkeleton className="h-10 flex-1" />
            <SimpleSkeleton className="h-10 w-[200px]" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <SimpleSkeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonText size="md" className="w-48" />
                  <SkeletonText size="sm" className="w-32" />
                </div>
                <SimpleSkeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
