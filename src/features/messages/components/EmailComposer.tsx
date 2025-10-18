'use client';

import { useState, useRef } from 'react';
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
import { Mail, Paperclip, X, Send, FileIcon, Loader2 } from 'lucide-react';
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
}

export function EmailComposer({ open, onOpenChange, recipientId, recipientName }: EmailComposerProps) {
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
                url: file.url,
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

    const isFormValid = subject.trim() && content.trim() &&
        (user?.role === 'CLIENT' ? caseId : selectedRecipient);

    // Form content component (reused in both Sheet and Dialog)
    const FormContent = () => (
        <div className="space-y-4">
            {/* Case/Client Selector */}
            {user?.role === 'CLIENT' ? (
                <div className="space-y-2">
                    <Label htmlFor="case-select">{t('email.selectCase') || 'Select Case'}</Label>
                    {isLoadingCases ? (
                        <SimpleSkeleton className="h-10 w-full rounded-md" />
                    ) : userCases.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            {t('email.noCasesAvailable') || 'No cases available. Please create a case first.'}
                        </div>
                    ) : (
                        <Select value={caseId} onValueChange={setCaseId}>
                            <SelectTrigger id="case-select">
                                <SelectValue placeholder={t('email.chooseCasePlaceholder') || 'Choose a case...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {userCases.map((caseItem: any) => (
                                    <SelectItem key={caseItem.id} value={caseItem.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{caseItem.referenceNumber}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {getServiceTypeLabel(caseItem.serviceType)} • {getCaseStatusLabel(caseItem.status)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {t('email.caseHelper') || 'Email will be sent to the agent assigned to this case'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="recipient">
                        {t('email.recipient') || 'Recipient'} {recipientName && `(${recipientName})`}
                    </Label>
                    <Input
                        id="recipient"
                        value={selectedRecipient}
                        onChange={(e) => setSelectedRecipient(e.target.value)}
                        placeholder={t('email.recipientPlaceholder') || 'Enter recipient ID or email'}
                        disabled={!!recipientId}
                    />
                </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
                <Label htmlFor="subject">{t('email.subject') || 'Subject'}</Label>
                <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('email.subjectPlaceholder') || 'Enter email subject...'}
                    maxLength={200}
                />
            </div>

            {/* Message Content - Rich Text Area */}
            <div className="space-y-2">
                <Label htmlFor="content">{t('email.message') || 'Message'}</Label>
                <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('email.contentPlaceholder') || 'Type your message here...'}
                    className="min-h-[200px] resize-y"
                    maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                    {content.length}/5000 characters
                </p>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
                <Label>{t('email.attachments') || 'Attachments'} (Optional)</Label>

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
                    <div className="space-y-2">
                        {attachments.map((attachment, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                            >
                                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{attachment.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {attachment.size > 1024 * 1024
                                            ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
                                            : `${(attachment.size / 1024).toFixed(0)} KB`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
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
                    className="w-full"
                >
                    <Paperclip className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : `Attach Files (${attachments.length}/3)`}
                </Button>
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

