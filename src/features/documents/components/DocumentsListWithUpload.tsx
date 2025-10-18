'use client';

import { useState, memo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useDocuments, useCreateDocument, useDeleteDocument } from '../api';
import { DocumentType } from '../types';
import type { Document } from '../types';
import { useUploadThing } from '@/lib/uploadthing/client';
import { FileText, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { DocumentCard } from './DocumentCard';
import { UploadDialog } from './UploadDialog';
import { SimpleSkeleton, SkeletonText, SkeletonCard } from '@/components/ui/simple-skeleton';
import { useTranslation } from 'react-i18next';

export function DocumentsList() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading, error, refetch } = useDocuments({});
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const { startUpload, isUploading } = useUploadThing('documentUploader');

  const handleUpload = async (selectedFile: File, documentType: DocumentType, caseId: string) => {
    if (!selectedFile || !documentType || !caseId) {
      toast.error(t('documents.selectFileTypeAndCase'));
      logger.warn('Upload validation failed: Missing required fields', {
        hasFile: !!selectedFile,
        hasDocumentType: !!documentType,
        hasCaseId: !!caseId,
      });
      return;
    }

    let uploadedFileUrl: string | null = null;
    let uploadedFileKey: string | null = null;
    let uploadSuccess = false;

    try {
      // Step 1: Upload file to storage
      logger.info('Starting file upload', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        documentType,
        caseId,
      });

      const uploadResult = await startUpload([selectedFile]);
      if (!uploadResult || uploadResult.length === 0) {
        throw new Error('Upload failed: No result returned from storage');
      }

      const uploaded = uploadResult[0];
      uploadedFileUrl = uploaded.url;
      uploadedFileKey = uploaded.key || uploaded.url; // key is used for deletion if available
      uploadSuccess = true;

      logger.info('File upload successful', {
        fileUrl: uploadedFileUrl,
        fileKey: uploadedFileKey,
      });

      // Step 2: Create document metadata in database
      logger.info('Creating document metadata', { fileUrl: uploadedFileUrl });

      await createDocument.mutateAsync({
        fileName: uploaded.name,
        originalName: selectedFile.name,
        filePath: uploaded.url,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        documentType: documentType as DocumentType,
        caseId,
      });

      logger.info('Document created successfully', { fileUrl: uploadedFileUrl });

      // Step 3: Success - Reset UI state and refetch
      toast.success(t('documents.uploadSuccess'));
      setUploadOpen(false);
      refetch();
    } catch (error) {
      // Determine which step failed
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (!uploadSuccess) {
        // Upload to storage failed
        logger.error('File upload failed', error, {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        });
        toast.error(t('documents.uploadFailed'));
      } else {
        // Document metadata creation failed - attempt rollback
        logger.error('Document metadata creation failed after successful upload', error, {
          fileUrl: uploadedFileUrl,
          fileKey: uploadedFileKey,
        });

        // Attempt to delete the uploaded file
        try {
          logger.info('Attempting rollback: Deleting uploaded file', {
            fileUrl: uploadedFileUrl,
            fileKey: uploadedFileKey,
          });

          const deleteResponse = await fetch('/api/uploadthing/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileKey: uploadedFileKey }),
          });

          if (!deleteResponse.ok) {
            throw new Error(`Delete failed with status ${deleteResponse.status}`);
          }

          const deleteResult = await deleteResponse.json();

          if (deleteResult.success) {
            logger.info('Rollback successful: Uploaded file deleted', {
              fileUrl: uploadedFileUrl,
              fileKey: uploadedFileKey,
            });
            toast.error(t('documents.uploadFailed'));
          } else {
            logger.warn('Rollback partial failure: File may not have been deleted', {
              fileUrl: uploadedFileUrl,
              fileKey: uploadedFileKey,
              deleteError: deleteResult.error,
            });
            toast.error(t('documents.uploadFailed'));
          }
        } catch (rollbackError) {
          logger.error('Rollback failed: Could not delete uploaded file', rollbackError, {
            fileUrl: uploadedFileUrl,
            fileKey: uploadedFileKey,
          });
          toast.error(t('documents.uploadFailed'));
        }
      }
    } finally {
      // Shared cleanup: Ensure UI is in consistent state
      // Note: We don't clear the form on error to allow user to retry
      // Only clear on success (which is handled in the try block)
    }
  };

  const handleView = (doc: Document): void => {
    // Validate URL before opening to prevent security issues
    try {
      const url = new URL(doc.filePath);

      // Define trusted domains for file hosting
      const trustedDomains = ['utfs.io', 'uploadthing.com'];

      // Check if the hostname ends with one of the trusted domains
      const isTrustedDomain = trustedDomains.some(
        (domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)
      );

      if (!isTrustedDomain) {
        toast.error(t('documents.invalidDocumentUrl'));
        return;
      }

      // Open with security features to prevent window.opener attacks
      window.open(doc.filePath, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(t('documents.invalidDocumentUrl'));
    }
  };

  const handleDownload = (doc: Document): void => {
    const link = document.createElement('a');
    link.href = doc.filePath;
    link.download = doc.originalName;
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('documents.deleteConfirm'))) return;
    await deleteDocument.mutateAsync(id);
    refetch();
  };

  if (isLoading) return <DocumentsListSkeleton />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('documents.errorLoadingShort')}</p>
      </div>
    );
  }

  const documents: Document[] = data?.documents || [];
  const filtered: Document[] = documents.filter(
    (d: Document) => statusFilter === 'all' || d.status === statusFilter
  );

  const isClient = user?.role === 'CLIENT';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('documents.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {isClient
              ? t('documents.manageDocuments')
              : isAdmin
                ? t('documents.reviewAllDocuments')
                : t('documents.reviewAssignedDocuments')}
          </p>
        </div>
        {/* Only show upload button for CLIENTS */}
        {isClient && (
          <UploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onUpload={handleUpload}
            isUploading={isUploading}
          />
        )}
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
            {isClient ? (
              <Button onClick={() => setUploadOpen(true)}>{t('documents.upload')}</Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t('documents.noDocumentsUploaded')}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((document: Document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onView={() => handleView(document)}
              onDownload={() => handleDownload(document)}
              onDelete={() => handleDelete(document.id)}
              showDelete={isClient && document.status !== 'APPROVED'}
              isDeleting={deleteDocument.isPending}
              showCaseInfo={!isClient}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PERFORMANCE OPTIMIZED: Reduced DOM complexity for better Core Web Vitals
 * - Reduced ~90 DOM elements to ~25 (70% reduction) → Better FCP
 * - Memoized component → Better TBT
 * - Simpler structure with SkeletonCard → Better Speed Index
 * - Reduced from 3 cards to 2 → Faster perceived loading
 */
export const DocumentsListSkeleton = memo(function DocumentsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header - Simplified from 4 to 3 elements */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonText size="xl" className="w-48" />
          <SkeletonText size="sm" className="w-72" />
        </div>
        <SimpleSkeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Filter - Single element instead of Card wrapper */}
      <SimpleSkeleton className="h-16 w-full rounded-lg" />

      {/* Document cards - Reduced from 3 to 2 cards */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
});
