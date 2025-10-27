'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useSendEmail } from '../api/mutations';
import { useCases } from '@/features/cases/api/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Mail, Paperclip, X, Send, FileIcon, Loader2, Briefcase, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { useTranslation } from 'react-i18next';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';
import { uploadFiles, getAuthHeaders } from '@/lib/uploadthing/client';
import type { MessageAttachment } from '@/lib/types';
import { useMediaQuery } from '@/lib/utils/hooks/useMediaQuery';

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string; // For agents - pre-select recipient
  recipientName?: string;
  recipientEmail?: string;
  caseReference?: string;
}

export function EmailComposer({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientEmail,
  caseReference,
}: EmailComposerProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const sendEmail = useSendEmail();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Form state
  const [caseId, setCaseId] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(recipientId || '');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selected recipient when props change
  useEffect(() => {
    if (recipientId) {
      setSelectedRecipient(recipientId);
    }
  }, [recipientId]);

  // Pre-fill subject with case reference if available
  useEffect(() => {
    if (caseReference && open && !subject) {
      setSubject(`Regarding Case: ${caseReference}`);
    }
  }, [caseReference, open]);

  // Fetch cases for clients (only when dialog is open for performance)
  const { data: casesData, isLoading: isLoadingCases } = useCases(
    { limit: 100 },
    { enabled: open && user?.role === 'CLIENT' }
  );

  const userCases = casesData?.cases || [];

  const handleReset = () => {
    setCaseId('');
    setSelectedRecipient('');
    setSubject('');
    setContent('');
    setAttachments([]);
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    if (user?.role === 'CLIENT' && !caseId) {
      toast.error('Please select a case');
      return;
    }

    if (user?.role !== 'CLIENT' && !selectedRecipient) {
      toast.error('Please select a recipient');
      return;
    }

    try {
      await sendEmail.mutateAsync({
        recipientId: selectedRecipient || undefined,
        caseId: caseId || undefined,
        subject,
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Success - reset form and close
      handleReset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
      logger.error('Email send error', error);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count (max 3)
    if (attachments.length + files.length > 3) {
      toast.error('Maximum 3 attachments allowed per email');
      return;
    }

    setIsUploading(true);
    try {
      logger.debug('[Email Upload] Starting upload', { fileCount: files.length });

      const headers = await getAuthHeaders();
      const uploadedFiles = await uploadFiles('messageAttachment', {
        files: Array.from(files),
        headers,
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Upload failed: No result returned');
      }

      const newAttachments: MessageAttachment[] = uploadedFiles.map((file) => ({
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      toast.success(`${uploadedFiles.length} file(s) attached`);
    } catch (error) {
      logger.error('File upload error:', error);
      toast.error('Failed to upload file(s)');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getServiceTypeLabel = (serviceType: string): string => {
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

  const getCaseStatusLabel = (status: string): string => {
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

  const isFormValid =
    subject.trim() && content.trim() && (user?.role === 'CLIENT' ? caseId : selectedRecipient);

  // Form content component (reused in both Sheet and Dialog)
  const FormContent = () => (
    <div className="space-y-5">
      {/* Recipient Info Card - For Agents/Admins */}
      {user?.role !== 'CLIENT' && (recipientName || recipientEmail) && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Sending email to:</h4>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mt-1">
                {recipientName}
              </p>
              {recipientEmail && (
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {recipientEmail}
                </p>
              )}
              {caseReference && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <Briefcase className="h-3 w-3" />
                  <span>Case: {caseReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Case/Client Selector */}
      {user?.role === 'CLIENT' ? (
        <div className="space-y-2">
          <Label htmlFor="case-select" className="text-sm font-semibold">
            {t('email.selectCase') || 'Select Case'}
          </Label>
          {isLoadingCases ? (
            <SimpleSkeleton className="h-10 w-full rounded-md" />
          ) : userCases.length === 0 ? (
            <div className="text-sm text-amber-700 dark:text-amber-300 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
              {t('email.noCasesAvailable') || 'No cases available. Please create a case first.'}
            </div>
          ) : (
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger id="case-select" className="h-11">
                <SelectValue placeholder={t('email.chooseCasePlaceholder') || 'Choose a case...'} />
              </SelectTrigger>
              <SelectContent>
                {userCases.map((caseItem: any) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{caseItem.referenceNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {getServiceTypeLabel(caseItem.serviceType)} •{' '}
                        {getCaseStatusLabel(caseItem.status)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            {t('email.caseHelper') || 'Email will be sent to the agent assigned to this case'}
          </p>
        </div>
      ) : null}

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
          {t('email.subject') || 'Subject'}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t('email.subjectPlaceholder') || 'Enter email subject...'}
          maxLength={200}
          className="h-11 text-base"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {subject.trim() ? '✓ Subject provided' : 'Subject is required'}
          </p>
          <p className="text-xs text-muted-foreground">{subject.length}/200</p>
        </div>
      </div>

      {/* Message Content - Rich Text Area */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-semibold flex items-center gap-2">
          {t('email.message') || 'Message'}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            t('email.contentPlaceholder') ||
            'Type your message here...\n\nYou can format your message with:\n• Line breaks\n• Bullet points\n• Multiple paragraphs'
          }
          className="min-h-[200px] resize-y text-base leading-relaxed"
          maxLength={5000}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {content.trim()
              ? `✓ ${content.split(/\s+/).filter(Boolean).length} words`
              : 'Message is required'}
          </p>
          <p className="text-xs text-muted-foreground">{content.length}/5000</p>
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">
          {t('email.attachments') || 'Attachments'} (Optional)
        </Label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Attached Files ({attachments.length}/3)
            </p>
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <FileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.size > 1024 * 1024
                      ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
                      : `${(attachment.size / 1024).toFixed(0)} KB`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  onClick={() => handleRemoveAttachment(index)}
                  disabled={isUploading || sendEmail.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || attachments.length >= 3 || sendEmail.isPending}
          className="w-full h-11 border-dashed border-2 hover:border-solid"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            `${attachments.length === 0 ? 'Add' : 'Add More'} Files (${attachments.length}/3)`
          )}
        </Button>
        {attachments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Support: Images, PDF, Word documents • Max 3 files
          </p>
        )}
      </div>
    </div>
  );

  // Desktop: Slide-over Sheet
  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('email.compose') || 'Compose Email'}
            </SheetTitle>
            <SheetDescription>
              {user?.role === 'CLIENT'
                ? t('email.clientDescription') || 'Send a formal email to your assigned agent'
                : t('email.agentDescription') || 'Send a formal email to your client'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <FormContent />
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={sendEmail.isPending}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isFormValid || sendEmail.isPending || isUploading}
            >
              {sendEmail.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('email.sending') || 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('email.send') || 'Send Email'}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('email.compose') || 'Compose Email'}
          </DialogTitle>
          <DialogDescription>
            {user?.role === 'CLIENT'
              ? t('email.clientDescription') || 'Send a formal email to your assigned agent'
              : t('email.agentDescription') || 'Send a formal email to your client'}
          </DialogDescription>
        </DialogHeader>

        <FormContent />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
            disabled={sendEmail.isPending}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isFormValid || sendEmail.isPending || isUploading}
          >
            {sendEmail.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('email.sending') || 'Sending...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('email.send') || 'Send Email'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
