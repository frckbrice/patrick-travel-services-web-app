'use client';

import type { Document } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  File,
  Image,
  FileIcon,
  ExternalLink,
  Briefcase,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const getStatusConfig = (t: any) => ({
  PENDING: {
    label: t('documents.pending'),
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  APPROVED: {
    label: t('documents.approved'),
    icon: CheckCircle2,
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

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return File;
  return FileIcon;
};

export interface DocumentCardProps {
  document: Document;
  onView: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  isDeleting?: boolean;
  showCaseInfo?: boolean; // Show case and client info for AGENT/ADMIN
}

export function DocumentCard({
  document,
  onView,
  onDownload,
  onDelete,
  showDelete = false,
  isDeleting = false,
  showCaseInfo = false,
}: DocumentCardProps) {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const docTypeLabels = getDocTypeLabels(t);
  const StatusIcon = statusConfig[document.status]?.icon || Clock;
  const FIcon = getFileIcon(document.mimeType);

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <div className="flex gap-4 flex-1">
              <div className="p-3 rounded-lg bg-muted">
                <FIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex gap-2 mb-1">
                  <h3 className="font-semibold truncate">{document.originalName}</h3>
                  <Badge
                    className={cn(
                      'flex items-center gap-1',
                      statusConfig[document.status]?.className || ''
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig[document.status]?.label || document.status}
                  </Badge>
                </div>

                {/* Case and Client Info for AGENT/ADMIN */}
                {showCaseInfo && document.case && (
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-primary">
                        {document.case.referenceNumber}
                      </span>
                    </div>
                    {document.uploadedBy && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>
                          {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                        </span>
                      </div>
                    )}
                    <Button variant="link" size="sm" className="h-auto p-0 text-sm" asChild>
                      <Link href={`/dashboard/cases/${document.caseId}`}>
                        {t('documents.viewCase')} <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {docTypeLabels[document.documentType] || document.documentType} •{' '}
                  {formatFileSize(document.fileSize)} •{' '}
                  {new Date(document.uploadDate).toLocaleDateString()}
                </p>
                {document.status === 'APPROVED' && document.verifiedBy && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {t('documents.verifiedBy')} {document.verifiedBy}
                  </p>
                )}
                {document.status === 'REJECTED' && document.rejectionReason && (
                  <div className="flex gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-600">{document.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onView}
                    aria-label={`View document: ${document.originalName ?? 'document'}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Document</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    aria-label={`Download document: ${document.originalName ?? 'document'}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Document</p>
                </TooltipContent>
              </Tooltip>

              {showDelete && onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDelete}
                      disabled={isDeleting}
                      aria-label={`Delete document: ${document.originalName ?? 'document'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Document</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
