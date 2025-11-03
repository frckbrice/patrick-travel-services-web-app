'use client';

import { useState, useEffect } from 'react';
import { DocumentType } from '../types';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCases } from '@/features/cases/api/queries';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';

// File validation constants
const MAX_SIZE = 16 * 1024 * 1024; // 16MB in bytes
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const getDocTypeLabels = (t: any): Record<DocumentType, string> => ({
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

const getServiceTypeLabel = (serviceType: string, t: any): string => {
  // Default English labels as fallback
  const defaultLabels: Record<string, string> = {
    STUDENT_VISA: 'Student Visa',
    WORK_PERMIT: 'Work Permit',
    FAMILY_REUNIFICATION: 'Family Reunification',
    TOURIST_VISA: 'Tourist Visa',
    BUSINESS_VISA: 'Business Visa',
    PERMANENT_RESIDENCY: 'Permanent Residency',
  };

  // Try translation first, fall back to default label
  const translationKey = `cases.serviceTypes.${serviceType}`;
  const translated = t(translationKey);

  // If translation returns the key itself, use default label
  if (translated === translationKey) {
    return defaultLabels[serviceType] || serviceType.replace(/_/g, ' ');
  }

  return translated;
};

const getCaseStatusLabel = (status: string, t: any): string => {
  // Default English labels as fallback
  const defaultLabels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    DOCUMENTS_REQUIRED: 'Documents Required',
    PROCESSING: 'Processing',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CLOSED: 'Closed',
  };

  // Try translation first, fall back to default label
  const translationKey = `cases.status.${status}`;
  const translated = t(translationKey);

  // If translation returns the key itself, use default label
  if (translated === translationKey) {
    return defaultLabels[status] || status.replace(/_/g, ' ');
  }

  return translated;
};

export interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, documentType: DocumentType, caseId: string) => Promise<void>;
  isUploading: boolean;
}

export function UploadDialog({ open, onOpenChange, onUpload, isUploading }: UploadDialogProps) {
  const { t } = useTranslation();
  const docTypeLabels = getDocTypeLabels(t);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [caseId, setCaseId] = useState<string>('');

  // Fetch user's cases for selection
  const {
    data: casesData,
    isLoading: isLoadingCases,
    isError: isErrorLoadingCases,
    refetch: refetchCases,
  } = useCases(
    { limit: 100 },
    {
      enabled: open, // Only fetch when dialog is open
      refetchOnMount: true, // Override default to ensure fresh data when opening
      staleTime: 30 * 1000, // 30 seconds - shorter than default for more recent data
    }
  );

  const userCases = casesData?.cases || [];

  // Log for debugging
  useEffect(() => {
    if (open) {
      logger.debug('[UploadDialog] Cases query state', {
        isLoading: isLoadingCases,
        isError: isErrorLoadingCases,
        casesCount: userCases.length,
        hasData: !!casesData,
      });
    }
  }, [open, isLoadingCases, isErrorLoadingCases, userCases.length, casesData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      toast.error(
        t('documents.invalidFileSize16MB', { size: (file.size / 1024 / 1024).toFixed(2) })
      );
      event.target.value = ''; // Reset input
      setSelectedFile(null);
      return;
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('documents.invalidFileTypeDetailed', { type: file.type || 'unknown' }));
      event.target.value = ''; // Reset input
      setSelectedFile(null);
      return;
    }

    // All validations passed
    setSelectedFile(file);
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !documentType || !caseId) {
      return;
    }

    try {
      await onUpload(selectedFile, documentType as DocumentType, caseId);

      // Reset form on successful upload
      setSelectedFile(null);
      setDocumentType('');
      setCaseId('');
    } catch (error) {
      toast.error(t('documents.uploadFailed'));
      logger.error('Upload error:', error);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDocumentType('');
    setCaseId('');
    onOpenChange(false);
  };

  const isFormValid = selectedFile && documentType && caseId && !isLoadingCases;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          {t('documents.uploadBtn')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('documents.upload')}</DialogTitle>
          <DialogDescription>{t('documents.uploadForCase')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">{t('documents.documentType')}</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
            >
              <SelectTrigger id="document-type">
                <SelectValue placeholder={t('documents.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(docTypeLabels).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('documents.file')}</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <p className="text-xs text-muted-foreground">{t('documents.maxSize16MB')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-select">{t('documents.selectCase') || 'Select Case'}</Label>
            {isLoadingCases ? (
              <SimpleSkeleton className="h-10 w-full rounded-md" />
            ) : isErrorLoadingCases ? (
              <div className="space-y-2">
                <div className="text-sm text-red-700 dark:text-red-300 p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">
                  {t('documents.casesLoadError') || 'Failed to load cases. Please try again.'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchCases()}
                  className="w-full"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {t('common.retry') || 'Retry'}
                </Button>
              </div>
            ) : userCases.length === 0 ? (
              <div className="text-sm text-amber-700 dark:text-amber-300 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                {t('documents.noCasesAvailable') ||
                  'No cases available. Please create a case first.'}
              </div>
            ) : (
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger id="case-select">
                  <SelectValue
                    placeholder={t('documents.chooseCasePlaceholder') || 'Choose a case...'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {userCases.map((caseItem: any) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{caseItem.referenceNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {getServiceTypeLabel(caseItem.serviceType, t)} •{' '}
                          {getCaseStatusLabel(caseItem.status, t)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              {t('documents.caseHelper') || 'Choose the case this document belongs to'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUploadClick} disabled={isUploading || !isFormValid}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('documents.uploading')}
              </>
            ) : (
              t('documents.uploadBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
