'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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

  // Fetch cases (for all users - now required for emails)
  const {
    data: casesData,
    isLoading: isLoadingCases,
    isError: isErrorLoadingCases,
    refetch: refetchCases,
  } = useCases(
    { limit: 100 },
    {
      enabled: open, // Now enabled for all users since caseId is required
      refetchOnMount: true, // Override default to ensure fresh data when opening
      staleTime: 30 * 1000, // 30 seconds - shorter than default for more recent data
    }
  );

  const userCases = casesData?.cases || [];

  // Log for debugging
  useEffect(() => {
    if (open) {
      logger.debug('[EmailComposer] Cases query state', {
        isLoading: isLoadingCases,
        isError: isErrorLoadingCases,
        casesCount: userCases.length,
        hasData: !!casesData,
      });
    }
  }, [open, isLoadingCases, isErrorLoadingCases, userCases.length, casesData]);

  const handleReset = useCallback(() => {
    setCaseId('');
    setSelectedRecipient('');
    setSubject('');
    setContent('');
    setAttachments([]);
  }, []);

  const handleSend = useCallback(async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    // CRITICAL: ALL emails must have a caseId
    if (!caseId) {
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
        caseId, // caseId is now required
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
  }, [
    subject,
    content,
    user?.role,
    caseId,
    selectedRecipient,
    sendEmail,
    attachments,
    handleReset,
    onOpenChange,
  ]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [attachments.length, sendEmail.isPending]
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Helper function to get human-readable service type labels with proper fallbacks
  const getServiceTypeLabel = useCallback(
    (serviceType: string): string => {
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
    },
    [t]
  );

  // Helper function to get human-readable status labels with proper fallbacks
  const getCaseStatusLabel = useCallback(
    (status: string): string => {
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
    },
    [t]
  );

  const isFormValid = useMemo(
    () =>
      subject.trim() &&
      content.trim() &&
      caseId &&
      (user?.role !== 'CLIENT' ? selectedRecipient : true),
    [subject, content, caseId, user?.role, selectedRecipient]
  );

  // Memoized input change handlers
  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleCaseChange = useCallback((value: string) => {
    setCaseId(value);
  }, []);

  // Form content component (reused in both Sheet and Dialog)
  // Memoized to prevent re-rendering and input jumping
  const FormContent = useMemo(
    () => (
      <div className="space-y-6 px-1">
        {/* Recipient Info Card - For Agents/Admins */}
        {user?.role !== 'CLIENT' && (recipientName || recipientEmail) && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Sending email to:
                </h4>
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

        {/* Case Selector - Required for ALL users */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="case-select" className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              {t('email.selectCase') || 'Select Case'}
              <span className="text-red-500">*</span>
            </Label>
            {userCases.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {userCases.length} {userCases.length === 1 ? 'case' : 'cases'}
              </span>
            )}
          </div>

          {isLoadingCases ? (
            <div className="space-y-2">
              <SimpleSkeleton className="h-14 w-full rounded-lg" />
              <SimpleSkeleton className="h-4 w-3/4 rounded" />
            </div>
          ) : isErrorLoadingCases ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-red-700 dark:text-red-300 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Unable to load cases</p>
                  <p className="text-xs mt-1 opacity-90">
                    {t('email.casesLoadError') || 'Please check your connection and try again.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchCases()}
                className="w-full h-10"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t('common.retry') || 'Retry'}
              </Button>
            </div>
          ) : userCases.length === 0 ? (
            <div className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No cases found</p>
                <p className="text-xs mt-1 opacity-90">
                  {t('email.noCasesAvailable') ||
                    'Please create a case first to send emails to your agent.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Select value={caseId} onValueChange={handleCaseChange}>
                <SelectTrigger
                  id="case-select"
                  className="h-14 hover:bg-accent/50 transition-colors border-2 focus:ring-2 focus:ring-primary/20"
                >
                  <SelectValue
                    placeholder={t('email.chooseCasePlaceholder') || 'Choose a case to continue...'}
                  >
                    {caseId &&
                      (() => {
                        const selectedCase = userCases.find((c: any) => c.id === caseId);
                        if (!selectedCase) return null;

                        const statusColorMap: Record<string, string> = {
                          SUBMITTED:
                            'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                          UNDER_REVIEW:
                            'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
                          DOCUMENTS_REQUIRED:
                            'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
                          PROCESSING:
                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
                          APPROVED:
                            'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                          REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                          CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                        };
                        const statusColor =
                          statusColorMap[selectedCase.status] ||
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

                        return (
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-sm">
                                {selectedCase.referenceNumber}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {getServiceTypeLabel(selectedCase.serviceType)}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor}`}
                            >
                              {getCaseStatusLabel(selectedCase.status)}
                            </span>
                          </div>
                        );
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {userCases.map((caseItem: any) => {
                    const statusColorMap: Record<string, string> = {
                      SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                      UNDER_REVIEW:
                        'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
                      DOCUMENTS_REQUIRED:
                        'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
                      PROCESSING:
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
                      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                      CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                    };
                    const statusColor =
                      statusColorMap[caseItem.status] ||
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

                    return (
                      <SelectItem
                        key={caseItem.id}
                        value={caseItem.id}
                        className="py-3 cursor-pointer hover:bg-accent focus:bg-accent"
                      >
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm">
                              {caseItem.referenceNumber}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}
                            >
                              {getCaseStatusLabel(caseItem.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            <span>{getServiceTypeLabel(caseItem.serviceType)}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('email.caseHelper') ||
                    'Your email will be sent to the agent assigned to the selected case'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-2.5">
          <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
            {t('email.subject') || 'Subject'}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={handleSubjectChange}
            placeholder={t('email.subjectPlaceholder') || 'Enter email subject...'}
            maxLength={200}
            className="h-12 text-base focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {subject.trim() ? '✓ Subject provided' : 'Subject is required'}
            </p>
            <p className="text-xs text-muted-foreground">{subject.length}/200</p>
          </div>
        </div>

        {/* Message Content - Rich Text Area */}
        <div className="space-y-2.5">
          <Label htmlFor="content" className="text-sm font-semibold flex items-center gap-2">
            {t('email.message') || 'Message'}
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            placeholder={
              t('email.contentPlaceholder') ||
              'Type your message here...\n\nYou can format your message with:\n• Line breaks\n• Bullet points\n• Multiple paragraphs'
            }
            className="min-h-[220px] resize-y text-base leading-relaxed focus:ring-2 focus:ring-primary/20 transition-all"
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
    ),
    [
      user?.role,
      recipientName,
      recipientEmail,
      caseReference,
      isLoadingCases,
      isErrorLoadingCases,
      userCases,
      caseId,
      subject,
      content,
      attachments,
      isUploading,
      sendEmail.isPending,
      t,
      handleCaseChange,
      handleSubjectChange,
      handleContentChange,
      handleRemoveAttachment,
      refetchCases,
      getServiceTypeLabel,
      getCaseStatusLabel,
    ]
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

          <div className="py-6 px-1">{FormContent}</div>

          <SheetFooter className="gap-3 sm:gap-3 pt-6 border-t sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-6">
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={sendEmail.isPending}
              className="flex-1 h-11"
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isFormValid || sendEmail.isPending || isUploading}
              className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5" />
            {t('email.compose') || 'Compose Email'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {user?.role === 'CLIENT'
              ? t('email.clientDescription') || 'Send a formal email to your assigned agent'
              : t('email.agentDescription') || 'Send a formal email to your client'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{FormContent}</div>

        <DialogFooter className="gap-3 flex-col sm:flex-row pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
            disabled={sendEmail.isPending}
            className="w-full h-11"
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isFormValid || sendEmail.isPending || isUploading}
            className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
