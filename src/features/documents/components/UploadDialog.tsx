'use client';

import { useState } from 'react';
import { DocumentType } from '../types';
import { Upload, Loader2 } from 'lucide-react';
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
  const labels: Record<string, string> = {
    STUDENT_VISA: t('cases.serviceTypes.STUDENT_VISA') || 'Student Visa',
    WORK_PERMIT: t('cases.serviceTypes.WORK_PERMIT') || 'Work Permit',
    FAMILY_REUNIFICATION: t('cases.serviceTypes.FAMILY_REUNIFICATION') || 'Family Reunification',
    TOURIST_VISA: t('cases.serviceTypes.TOURIST_VISA') || 'Tourist Visa',
    BUSINESS_VISA: t('cases.serviceTypes.BUSINESS_VISA') || 'Business Visa',
    PERMANENT_RESIDENCY: t('cases.serviceTypes.PERMANENT_RESIDENCY') || 'Permanent Residency',
  };
  return labels[serviceType] || serviceType;
};

const getCaseStatusLabel = (status: string, t: any): string => {
  const labels: Record<string, string> = {
    SUBMITTED: t('cases.status.SUBMITTED') || 'Submitted',
    UNDER_REVIEW: t('cases.status.UNDER_REVIEW') || 'Under Review',
    DOCUMENTS_REQUIRED: t('cases.status.DOCUMENTS_REQUIRED') || 'Documents Required',
    PROCESSING: t('cases.status.PROCESSING') || 'Processing',
    APPROVED: t('cases.status.APPROVED') || 'Approved',
    REJECTED: t('cases.status.REJECTED') || 'Rejected',
    CLOSED: t('cases.status.CLOSED') || 'Closed',
  };
  return labels[status] || status;
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
  const { data: casesData, isLoading: isLoadingCases } = useCases(
    { limit: 100 },
    { enabled: open } // Only fetch when dialog is open
  );

  const userCases = casesData?.cases || [];

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
      toast.error(
        t('documents.invalidFileTypeDetailed', { type: file.type || 'unknown' })
      );
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
      console.error('Upload error:', error);
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
            <p className="text-xs text-muted-foreground">
              {t('documents.maxSize16MB')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-select">{t('documents.selectCase') || 'Select Case'}</Label>
            {isLoadingCases ? (
              <SimpleSkeleton className="h-10 w-full rounded-md" />
            ) : userCases.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {t('documents.noCasesAvailable') || 'No cases available. Please create a case first.'}
              </div>
            ) : (
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger id="case-select">
                  <SelectValue placeholder={t('documents.chooseCasePlaceholder') || 'Choose a case...'} />
                </SelectTrigger>
                <SelectContent>
                  {userCases.map((caseItem: any) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{caseItem.referenceNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {getServiceTypeLabel(caseItem.serviceType, t)} • {getCaseStatusLabel(caseItem.status, t)}
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
