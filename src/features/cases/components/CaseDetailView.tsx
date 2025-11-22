'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useCase, useUpdateCaseStatus, useAddInternalNote } from '../api';
import { useApproveDocument, useRejectDocument } from '@/features/documents/api';
import { AssignCaseDialog } from './AssignCaseDialog';
import { CaseTransferDialog } from './CaseTransferDialog';
import type { Appointment, Case, Document } from '../types';
import { AppointmentStatus } from '../types';
import { CaseSchema } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorState } from '@/components/ui/error-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Briefcase,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  Flag,
  Eye,
  Download,
  UserPlus,
  RefreshCw,
  Send,
  MapPin,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { formatDateTime } from '@/lib/utils/helpers';
import { ScheduleAppointmentDialog } from './ScheduleAppointmentDialog';
import { useTranslation } from 'react-i18next';

interface CaseDetailViewProps {
  caseId: string;
}

// Status options will be created inside component to use translation

// Status config will be created inside component to use translation

// Appointment status config will be created inside component to use translation

// Priority options will be created inside component to use translation

export function CaseDetailView({ caseId }: CaseDetailViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useCase(caseId);
  const updateCaseStatus = useUpdateCaseStatus(caseId);
  const addInternalNote = useAddInternalNote(caseId);
  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();

  // Create translated configs
  const statusOptions = [
    { value: 'SUBMITTED', label: t('cases.statusLabels.SUBMITTED') },
    { value: 'UNDER_REVIEW', label: t('cases.statusLabels.UNDER_REVIEW') },
    { value: 'DOCUMENTS_REQUIRED', label: t('cases.statusLabels.DOCUMENTS_REQUIRED') },
    { value: 'PROCESSING', label: t('cases.statusLabels.PROCESSING') },
    { value: 'APPROVED', label: t('cases.statusLabels.APPROVED') },
    { value: 'REJECTED', label: t('cases.statusLabels.REJECTED') },
  ];

  const statusConfig: Record<string, { label: string; className: string }> = {
    SUBMITTED: {
      label: t('cases.statusLabels.SUBMITTED'),
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    UNDER_REVIEW: {
      label: t('cases.statusLabels.UNDER_REVIEW'),
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    DOCUMENTS_REQUIRED: {
      label: t('cases.statusLabels.DOCUMENTS_REQUIRED'),
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    },
    PROCESSING: {
      label: t('cases.statusLabels.PROCESSING'),
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    },
    APPROVED: {
      label: t('cases.statusLabels.APPROVED'),
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    REJECTED: {
      label: t('cases.statusLabels.REJECTED'),
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    CLOSED: {
      label: t('cases.statusLabels.CLOSED'),
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
  };

  const appointmentStatusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
    [AppointmentStatus.SCHEDULED]: {
      label: t('cases.detailView.scheduled'),
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    [AppointmentStatus.RESCHEDULED]: {
      label: t('cases.detailView.rescheduled'),
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    },
    [AppointmentStatus.COMPLETED]: {
      label: t('cases.detailView.completed'),
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    [AppointmentStatus.CANCELLED]: {
      label: t('cases.detailView.cancelled'),
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
  };

  const priorityOptions = [
    { value: 'LOW', label: t('cases.priorityLabels.LOW'), color: 'text-gray-600' },
    { value: 'NORMAL', label: t('cases.priorityLabels.NORMAL'), color: 'text-blue-600' },
    { value: 'HIGH', label: t('cases.priorityLabels.HIGH'), color: 'text-orange-600' },
    { value: 'URGENT', label: t('cases.priorityLabels.URGENT'), color: 'text-red-600' },
  ];
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  if (isLoading) return <CaseDetailSkeleton />;
  if (error || !data)
    return (
      <ErrorState
        variant="not-found"
        title={t('cases.detailView.caseNotFound')}
        description={
          error ? t('cases.detailView.couldNotLoadCase') : t('cases.detailView.caseDoesNotExist')
        }
        onRetry={refetch}
        errorDetails={error?.message}
      />
    );

  // Validate the API response with Zod schema
  const validationResult = CaseSchema.safeParse(data);

  if (!validationResult.success) {
    // Log validation error with details
    logger.error('Invalid case data received from API', validationResult.error, {
      caseId,
      validationErrors: JSON.stringify(validationResult.error.issues),
    });

    // Show error UI to user
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
        <div>
          <p className="text-red-600 font-semibold">{t('cases.detailView.invalidCaseData')}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('cases.detailView.malformedCaseData')}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          {t('cases.detailView.tryAgain')}
        </Button>
      </div>
    );
  }

  // Use the validated data
  const caseData = validationResult.data as Case;
  const isAgent = user?.role === 'AGENT' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isUnassigned = !caseData.assignedAgentId;

  const shouldShowAppointmentCard =
    caseData.status === 'APPROVED' || (caseData.appointments?.length ?? 0) > 0;

  const { upcomingAppointment, otherAppointments } = splitAppointments(caseData.appointments);

  const handleStatusUpdate = async () => {
    try {
      await updateCaseStatus.mutateAsync({
        status: newStatus,
        note: statusNote || undefined,
      });
      toast.success(t('cases.detailView.caseStatusUpdated'));
      setStatusNote('');
      setNewStatus('');
      setStatusDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleApproveDocument = async (docId: string) => {
    try {
      await approveDocument.mutateAsync(docId);
      toast.success(t('cases.detailView.documentApproved'));
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
      logger.error('Failed to approve document', error, { docId, caseId });
    }
  };

  const handleRejectDocument = async (docId: string, reason: string) => {
    try {
      await rejectDocument.mutateAsync({ id: docId, reason });
      toast.success(t('cases.detailView.documentRejected'));
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedDocId('');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
      logger.error('Failed to reject document', error, { docId, caseId, reason });
    }
  };

  const handleViewDocument = (doc: Document) => {
    try {
      logger.info('Attempting to view document (case)', {
        filePath: doc.filePath,
        documentId: doc.id,
      });

      if (!doc.filePath) {
        logger.error('Document filePath is empty (case)', { documentId: doc.id });
        toast.error(t('cases.detailView.invalidDocumentUrl'));
        return;
      }

      let fileUrl = doc.filePath;

      // If it's not a full URL, add https://
      if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        logger.warn('Document filePath is not a full URL (case), adding https://', {
          filePath: doc.filePath,
        });
        fileUrl = `https://${fileUrl}`;
      }

      const url = new URL(fileUrl);
      const trustedDomains = ['utfs.io', 'uploadthing.com', 'ufs.sh', 'res.cloudinary.com'];
      const isTrusted = trustedDomains.some(
        (domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)
      );

      if (!isTrusted) {
        logger.warn('Document URL is not from trusted domain (case)', {
          hostname: url.hostname,
          fileUrl,
        });
        toast.error(t('cases.detailView.invalidDocumentUrl'));
        return;
      }

      logger.info('Opening document in new tab (case)', { fileUrl });
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      logger.error('Failed to open document (case)', error, {
        filePath: doc.filePath,
        documentId: doc.id,
      });
      toast.error(t('cases.detailView.invalidDocumentUrl'));
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      logger.info('Starting document download (case)', {
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

      logger.info('Document downloaded successfully (case)', {
        documentId: doc.id,
        originalName: doc.originalName,
      });
    } catch (error) {
      logger.error('Failed to download document (case)', error, {
        documentId: doc.id,
        filePath: doc.filePath,
      });
      toast.error(t('cases.detailView.failedToDownload'));
    }
  };

  const handleSaveNote = async () => {
    if (!internalNote.trim()) {
      toast.error(t('cases.detailView.noteCannotBeEmpty'));
      return;
    }

    setSavingNote(true);
    try {
      await addInternalNote.mutateAsync({
        note: internalNote,
      });
      toast.success(t('cases.detailView.internalNoteSaved'));
      setInternalNote('');
      refetch();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.error || err.message || t('cases.detailView.failedToSaveNote');
      toast.error(errorMessage);
      logger.error('Failed to save internal note', error, {
        caseId,
        noteLength: internalNote.length,
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleMessageClient = () => {
    if (!caseData.client) {
      toast.error(t('cases.detailView.clientInfoNotAvailable'));
      return;
    }
    // Navigate to messages page with client parameters
    const clientName =
      `${caseData.client.firstName || ''} ${caseData.client.lastName || ''}`.trim();
    router.push(
      `/dashboard/messages?clientId=${caseData.clientId}&clientName=${encodeURIComponent(clientName)}&clientEmail=${encodeURIComponent(caseData.client.email)}&caseRef=${encodeURIComponent(caseData.referenceNumber)}`
    );
  };

  const handleEmailClient = () => {
    if (!caseData.client) {
      toast.error(t('cases.detailView.clientInfoNotAvailable'));
      return;
    }
    // Navigate to messages page with email mode and client parameters
    const clientName =
      `${caseData.client.firstName || ''} ${caseData.client.lastName || ''}`.trim();
    router.push(
      `/dashboard/messages?mode=email&clientId=${caseData.clientId}&clientName=${encodeURIComponent(clientName)}&clientEmail=${encodeURIComponent(caseData.client.email)}&caseRef=${encodeURIComponent(caseData.referenceNumber)}`
    );
  };

  const handleAppointmentScheduled = () => {
    refetch();
  };

  const getAppointmentAdvisorDetails = (appointment: Appointment) => {
    const source = appointment.assignedAgent ?? appointment.createdBy;
    if (!source) {
      return { name: t('cases.detailView.advisor'), email: undefined as string | undefined };
    }
    const displayName = `${source.firstName ?? ''} ${source.lastName ?? ''}`.trim();
    return {
      name: displayName || source.email || t('cases.detailView.advisor'),
      email: source.email || undefined,
    };
  };

  const renderAppointmentAdvisor = (appointment: Appointment) => {
    const details = getAppointmentAdvisorDetails(appointment);
    return (
      <div className="flex flex-col">
        <span className="font-semibold">{details.name}</span>
        {details.email && (
          <span className="font-normal text-xs text-muted-foreground">{details.email}</span>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold break-words">
                {caseData.referenceNumber}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  priorityOptions.find((p) => p.value === caseData.priority)?.color ||
                    'text-gray-600'
                )}
              >
                <Flag className="h-3 w-3 mr-1" />
                {caseData.priority}
              </Badge>
              {isUnassigned && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unassigned
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm sm:text-base break-words">
              {caseData.serviceType.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Assign to Agent Button (ADMIN only, unassigned cases) */}
            {isAdmin && isUnassigned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign to Agent
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assign this case to an immigration advisor</p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Transfer Case Button (ADMIN only, assigned cases) */}
            {isAdmin && !isUnassigned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Transfer Case
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Transfer this case to another agent</p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Update Status Button (Agent/Admin, assigned cases) */}
            {isAgent && !isUnassigned && (
              <Tooltip>
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('cases.detailView.updateCaseStatus')}</DialogTitle>
                      <DialogDescription>{t('cases.detailView.changeStatus')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>{t('cases.detailView.newStatus')}</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('cases.detailView.selectStatus')} />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t('cases.detailView.noteOptional')}</Label>
                        <Textarea
                          placeholder={t('cases.detailView.addNoteAboutStatusChange')}
                          value={statusNote}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setStatusNote(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStatusDialogOpen(false)}
                        disabled={updateCaseStatus.isPending}
                        className="w-full sm:w-auto"
                      >
                        {t('cases.detailView.cancel')}
                      </Button>
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={!newStatus || updateCaseStatus.isPending}
                        className="w-full sm:w-auto"
                      >
                        {updateCaseStatus.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            {t('cases.detailView.updating')}
                          </>
                        ) : (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('cases.detailView.updateStatus')}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  <TooltipContent>
                    <p>{t('cases.detailView.updateCurrentStatus')}</p>
                  </TooltipContent>
                </Dialog>
              </Tooltip>
            )}
            {isAgent && caseData.status === 'APPROVED' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" onClick={() => setAppointmentDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('cases.detailView.manageAppointment')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('cases.detailView.createOrUpdateAppointment')}</p>
                  </TooltipContent>
                </Tooltip>
                <ScheduleAppointmentDialog
                  caseId={caseData.id}
                  caseReference={caseData.referenceNumber}
                  clientName={
                    caseData.client
                      ? `${caseData.client.firstName ?? ''} ${caseData.client.lastName ?? ''}`.trim()
                      : undefined
                  }
                  open={appointmentDialogOpen}
                  onOpenChange={setAppointmentDialogOpen}
                  onAppointmentScheduled={handleAppointmentScheduled}
                />
              </>
            )}
          </div>
        </div>

        {/* Assign Case Dialog */}
        <AssignCaseDialog
          caseData={caseData}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={refetch}
        />

        {/* Transfer Case Dialog */}
        <CaseTransferDialog
          caseData={caseData}
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          onSuccess={refetch}
        />

        {/* Reject Document Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('cases.detailView.rejectDocument')}</DialogTitle>
              <DialogDescription>{t('cases.detailView.provideRejectionReason')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t('cases.detailView.rejectionReason')}</Label>
                <Textarea
                  placeholder={t('cases.detailView.enterRejectionReason')}
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setRejectReason(e.target.value)
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason('');
                  setSelectedDocId('');
                }}
                disabled={rejectDocument.isPending}
                className="w-full sm:w-auto"
              >
                {t('cases.detailView.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRejectDocument(selectedDocId, rejectReason)}
                disabled={!rejectReason.trim() || rejectDocument.isPending}
                className="w-full sm:w-auto"
              >
                {rejectDocument.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t('cases.detailView.rejecting')}
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('cases.detailView.rejectDocumentButton')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="w-full inline-flex min-w-max sm:w-auto">
              <TabsTrigger value="overview" className="whitespace-nowrap">
                {t('cases.detailView.overview')}
              </TabsTrigger>
              <TabsTrigger value="documents" className="whitespace-nowrap">
                {t('cases.detailView.documents')} ({caseData.documents?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="whitespace-nowrap">
                {t('cases.detailView.timeline')}
              </TabsTrigger>
              {isAgent && (
                <TabsTrigger value="notes" className="whitespace-nowrap">
                  {t('cases.detailView.internalNotes')}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            {shouldShowAppointmentCard && (
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">
                      {t('cases.detailView.appointments')}
                    </CardTitle>
                    <CardDescription>
                      {t('cases.detailView.officeMeetingsScheduled')}
                    </CardDescription>
                  </div>
                  {isAgent && caseData.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAppointmentDialogOpen(true)}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t('cases.detailView.schedule')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointment ? (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('cases.detailView.nextAppointment')}
                          </p>
                          <p className="text-lg font-semibold">
                            {formatDateTime(upcomingAppointment.scheduledAt)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize',
                            appointmentStatusConfig[upcomingAppointment.status].className
                          )}
                        >
                          {appointmentStatusConfig[upcomingAppointment.status].label}
                        </Badge>
                      </div>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        <InfoRow
                          icon={MapPin}
                          label={t('cases.detailView.location')}
                          value={upcomingAppointment.location}
                        />
                        <InfoRow
                          icon={User}
                          label={t('cases.detailView.advisor')}
                          value={renderAppointmentAdvisor(upcomingAppointment)}
                        />
                      </div>
                      {upcomingAppointment.notes && (
                        <InfoRow
                          icon={FileText}
                          label={t('cases.detailView.notes')}
                          value={upcomingAppointment.notes}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
                      {t('cases.detailView.noAppointmentsScheduled')}
                    </div>
                  )}

                  {otherAppointments.length > 0 && (
                    <div className="space-y-3">
                      <Separator />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('cases.detailView.appointmentHistory')}
                      </p>
                      <div className="space-y-2">
                        {otherAppointments.map((appointment) => {
                          const details = getAppointmentAdvisorDetails(appointment);
                          return (
                            <div
                              key={appointment.id}
                              className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                            >
                              <div>
                                <p className="text-sm font-semibold">
                                  {formatDateTime(appointment.scheduledAt)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {appointment.location}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {details.name}
                                  {details.email ? ` • ${details.email}` : ''}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'capitalize',
                                  appointmentStatusConfig[appointment.status].className
                                )}
                              >
                                {appointmentStatusConfig[appointment.status].label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('cases.detailView.caseInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow
                    icon={Briefcase}
                    label={t('cases.status')}
                    value={
                      <Badge
                        className={cn(
                          'flex items-center gap-1',
                          statusConfig[caseData.status]?.className || ''
                        )}
                      >
                        {statusConfig[caseData.status]?.label || caseData.status.replace(/_/g, ' ')}
                      </Badge>
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    label={t('cases.detailView.submitted')}
                    value={new Date(caseData.submissionDate).toLocaleDateString()}
                  />
                  <InfoRow
                    icon={Clock}
                    label={t('cases.detailView.lastUpdated')}
                    value={new Date(caseData.lastUpdated).toLocaleDateString()}
                  />
                  <InfoRow
                    icon={Flag}
                    label={t('cases.priority')}
                    value={
                      priorityOptions.find((p) => p.value === caseData.priority)?.label ||
                      caseData.priority
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('cases.detailView.clientInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow
                    icon={User}
                    label={t('cases.detailView.name')}
                    value={
                      caseData.client?.firstName || caseData.client?.lastName
                        ? `${caseData.client?.firstName ?? ''} ${caseData.client?.lastName ?? ''}`.trim()
                        : '—'
                    }
                  />
                  <InfoRow
                    icon={Mail}
                    label={t('cases.detailView.email')}
                    value={caseData.client?.email || 'N/A'}
                  />
                  <InfoRow
                    icon={Phone}
                    label={t('cases.detailView.phone')}
                    value={caseData.client?.phone || 'N/A'}
                  />

                  {/* Message/Email Client Actions - Only for Agents/Admins */}
                  {isAgent && caseData.client && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {t('cases.detailView.clientCommunication')}
                        </p>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={handleMessageClient}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {t('cases.detailView.chat')}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('cases.detailView.startRealtimeChat')}</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={handleEmailClient}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {t('cases.detailView.emailButton')}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('cases.detailView.sendFormalEmail')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {caseData.documents && caseData.documents.length > 0 ? (
              <div className="grid gap-4">
                {caseData.documents.map((doc: Document) => (
                  <Card key={doc.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-semibold">{doc.originalName}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.documentType} • {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              doc.status === 'APPROVED'
                                ? 'default'
                                : doc.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {doc.status}
                          </Badge>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDocument(doc)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('cases.detailView.viewDocument')}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('cases.detailView.downloadDocument')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                          {isAgent && doc.status === 'PENDING' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApproveDocument(doc.id)}
                                    disabled={approveDocument.isPending}
                                  >
                                    {approveDocument.isPending ? (
                                      <>
                                        <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                                        {t('cases.detailView.approving')}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-1 h-4 w-4" />
                                        {t('cases.detailView.approve')}
                                      </>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('cases.detailView.approveDocumentValid')}</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDocId(doc.id);
                                      setRejectDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    {t('cases.detailView.reject')}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('cases.detailView.rejectDocumentRequestNew')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('cases.detailView.noDocuments')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>{t('cases.detailView.timeline')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TimelineItem
                    date={caseData.submissionDate}
                    title="Case Submitted"
                    description={`Client submitted ${caseData.serviceType.replace(/_/g, ' ')} application`}
                    icon={Briefcase}
                  />

                  {/* Transfer History (Future: from caseData.transferHistory) */}
                  {/* When transfer history API is connected, display transfers here */}
                  {caseData.assignedAgent && (
                    <TimelineItem
                      date={caseData.lastUpdated}
                      title="Currently Assigned"
                      description={`Agent: ${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}`}
                      icon={User}
                    />
                  )}

                  <TimelineItem
                    date={caseData.lastUpdated}
                    title="Last Updated"
                    description={`Status: ${caseData.status.replace(/_/g, ' ')}`}
                    icon={Clock}
                    isLast={true}
                  />

                  {/* Note: Transfer history will appear here when case is transferred */}
                  {!caseData.assignedAgent && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 text-sm mt-4">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-orange-700 dark:text-orange-300">
                        This case has not been assigned to an agent yet. Transfer history will
                        appear here once the case is assigned and transferred.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAgent && (
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>{t('cases.detailView.internalNotes')}</CardTitle>
                  <CardDescription>{t('cases.detailView.addInternalNote')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Textarea
                      placeholder={t('cases.detailView.notePlaceholder')}
                      value={internalNote}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setInternalNote(e.target.value)
                      }
                      rows={4}
                      disabled={savingNote}
                    />
                    <Button
                      className="mt-2"
                      onClick={handleSaveNote}
                      disabled={!internalNote || savingNote}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {savingNote ? t('cases.detailView.saving') : t('cases.detailView.saveNote')}
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {caseData.internalNotes && (
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                        {caseData.internalNotes}
                      </p>
                    )}
                    {!caseData.internalNotes && (
                      <p className="text-sm text-muted-foreground">
                        {t('cases.detailView.noNotesYet')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function splitAppointments(appointments?: Appointment[] | null) {
  if (!appointments || appointments.length === 0) {
    return {
      upcomingAppointment: null as Appointment | null,
      otherAppointments: [] as Appointment[],
    };
  }

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const now = Date.now();
  const upcoming =
    sorted.find(
      (appointment) =>
        new Date(appointment.scheduledAt).getTime() >= now &&
        appointment.status !== AppointmentStatus.CANCELLED
    ) ?? sorted[0];

  const remaining = sorted.filter((appointment) => appointment.id !== upcoming.id);

  return { upcomingAppointment: upcoming, otherAppointments: remaining };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function TimelineItem({
  date,
  title,
  description,
  icon: Icon,
  isLast = false,
}: {
  date: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {!isLast && <div className="w-0.5 h-full bg-border mt-2"></div>}
      </div>
      <div className="pb-4">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{new Date(date).toLocaleString()}</p>
      </div>
    </div>
  );
}

export function CaseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
