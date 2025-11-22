'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useDocuments, useCreateDocument } from '../api';
import { useUploadThing } from '@/lib/uploadthing/client';
import type { Document } from '../types';
import { DocumentType } from '@/lib/types';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DocumentCard } from './DocumentCard';
import { useTranslation } from 'react-i18next';

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

const formatFileSize = (bytes: number) =>
  bytes < 1024
    ? bytes + ' B'
    : bytes < 1024 * 1024
      ? (bytes / 1024).toFixed(1) + ' KB'
      : (bytes / (1024 * 1024)).toFixed(1) + ' MB';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function DocumentsList() {
  const { t } = useTranslation();
  const docTypeLabels = getDocTypeLabels(t);
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [caseId, setCaseId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // PERFORMANCE: Add caching for instant navigation
  const {
    data,
    isLoading,
    error: queryError,
  } = useDocuments(
    {},
    {
      staleTime: 60000, // Cache for 60 seconds
      gcTime: 600000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Use cached data
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    }
  );
  const createDocument = useCreateDocument();
  const { startUpload } = useUploadThing('documentUploader');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file size (<=10MB)
    if (file.size > MAX_FILE_SIZE) {
      setError(t('documents.invalidFileSize'));
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(t('documents.invalidFileType'));
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType || !caseId) {
      setError(t('documents.fillAllFields'));
      return;
    }

    if (error) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload file to UploadThing
      const uploadResult = await startUpload([selectedFile]);

      if (!uploadResult || uploadResult.length === 0) {
        throw new Error('File upload failed');
      }

      const uploaded = uploadResult[0];

      // Save document metadata
      await createDocument.mutateAsync({
        fileName: uploaded.name,
        originalName: selectedFile.name,
        filePath: uploaded.url,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        documentType: selectedType,
        caseId,
      });

      // Success feedback
      toast.success(t('documents.uploadSuccess'));

      // Close dialog and reset form
      setUploadOpen(false);
      setSelectedFile(null);
      setSelectedType('');
      setCaseId('');
      setError('');
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || err?.message || t('documents.uploadFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setUploadOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setSelectedFile(null);
      setSelectedType('');
      setCaseId('');
      setError('');
    }
  };

  // PERFORMANCE: Only show skeleton on first load (no cached data)
  const isFirstLoad = isLoading && !data;
  if (isFirstLoad) return <DocumentsListSkeleton />;
  if (queryError)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('documents.errorLoading')}</p>
      </div>
    );

  const documents: Document[] = data?.documents ?? [];
  const filtered = documents.filter(
    (d: Document) => statusFilter === 'all' || d.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('documents.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('documents.manageDocuments')}</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              {t('documents.uploadBtn')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('documents.upload')}</DialogTitle>
              <DialogDescription>{t('documents.uploadNew')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t('documents.documentType')}</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as DocumentType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('documents.selectDocumentType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('documents.caseId')}</Label>
                <Input
                  type="text"
                  placeholder={t('documents.enterCaseId')}
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">{t('documents.caseIdHelper')}</p>
              </div>
              <div>
                <Label>{t('documents.file')}</Label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">{t('documents.maxSize10MB')}</p>
                {selectedFile && !error && (
                  <p className="text-xs text-green-600 mt-1">
                    {t('documents.fileSelected', {
                      name: selectedFile.name,
                      size: formatFileSize(selectedFile.size),
                    })}
                  </p>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={loading || !selectedFile || !selectedType || !caseId || !!error}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('documents.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('documents.uploadBtn')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('documents.all')}</SelectItem>
              <SelectItem value="PENDING">{t('documents.pending')}</SelectItem>
              <SelectItem value="APPROVED">{t('documents.approved')}</SelectItem>
              <SelectItem value="REJECTED">{t('documents.rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('documents.noDocuments')}</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== 'all'
                ? t('documents.noDocumentsMatch')
                : t('documents.uploadFirst')}
            </p>
            <Button onClick={() => setUploadOpen(true)}>{t('documents.uploadBtn')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((d: Document) => (
            <DocumentCard
              key={d.id}
              document={d}
              onView={() => {
                // Validate URL before opening to prevent security issues
                try {
                  const url = new URL(d.filePath);
                  const trustedDomains = ['utfs.io', 'uploadthing.com', 'res.cloudinary.com'];
                  const isTrustedDomain = trustedDomains.some(
                    (domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)
                  );
                  if (!isTrustedDomain) {
                    toast.error(t('documents.invalidDocumentUrl'));
                    return;
                  }
                  window.open(d.filePath, '_blank', 'noopener,noreferrer');
                } catch (error) {
                  toast.error(t('documents.invalidDocumentUrl'));
                }
              }}
              onDownload={() => {
                // Open file in new tab (download attribute doesn't work for cross-origin URLs)
                try {
                  const opened = window.open(d.filePath, '_blank', 'noopener');
                  if (opened) {
                    toast.success(t('documents.openedInNewTab'));
                  } else {
                    toast.error(t('documents.failedToOpen'));
                  }
                } catch (error) {
                  toast.error(t('documents.failedToOpenShort'));
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
