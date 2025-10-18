'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCase, useUpdateCaseStatus, useAddInternalNote } from '../api';
import { useApproveDocument, useRejectDocument } from '@/features/documents/api';
import { AssignCaseDialog } from './AssignCaseDialog';
import { CaseTransferDialog } from './CaseTransferDialog';
import type { Case, Document } from '../types';
import { CaseSchema } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/error-handler';

interface CaseDetailViewProps {
  caseId: string;
}

const statusOptions = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'DOCUMENTS_REQUIRED', label: 'Documents Required' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-gray-600' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
];

export function CaseDetailView({ caseId }: CaseDetailViewProps) {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useCase(caseId);
  const updateCaseStatus = useUpdateCaseStatus(caseId);
  const addInternalNote = useAddInternalNote(caseId);
  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();
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

  if (isLoading) return <CaseDetailSkeleton />;
  if (error || !data)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Case not found</p>
      </div>
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
          <p className="text-red-600 font-semibold">Invalid Case Data</p>
          <p className="text-sm text-muted-foreground mt-2">
            The case data received from the server is malformed. Please contact support.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Use the validated data
  const caseData = validationResult.data as Case;
  const isAgent = user?.role === 'AGENT' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isUnassigned = !caseData.assignedAgentId;

  const handleStatusUpdate = async () => {
    try {
      await updateCaseStatus.mutateAsync({
        status: newStatus,
        note: statusNote || undefined,
      });
      toast.success('Case status updated successfully');
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
      toast.success('Document approved successfully');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
      logger.error('Failed to approve document', error, { docId, caseId });
    }
  };

  const handleRejectDocument = async (docId: string, reason: string) => {
    try {
      await rejectDocument.mutateAsync({ id: docId, reason });
      toast.success('Document rejected successfully');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedDocId('');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
      logger.error('Failed to reject document', error, { docId, caseId, reason });
    }
  };

  const handleSaveNote = async () => {
    if (!internalNote.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    setSavingNote(true);
    try {
      await addInternalNote.mutateAsync({
        note: internalNote,
      });
      toast.success('Internal note saved successfully');
      setInternalNote('');
      refetch();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save note';
      toast.error(errorMessage);
      logger.error('Failed to save internal note', error, {
        caseId,
        noteLength: internalNote.length,
      });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{caseData.referenceNumber}</h1>
            <Badge
              variant="outline"
              className={cn(
                priorityOptions.find((p) => p.value === caseData.priority)?.color || 'text-gray-600'
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
          <p className="text-muted-foreground">{caseData.serviceType.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Assign to Agent Button (ADMIN only, unassigned cases) */}
          {isAdmin && isUnassigned && (
            <Button variant="default" onClick={() => setAssignDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign to Agent
            </Button>
          )}
          {/* Transfer Case Button (ADMIN only, assigned cases) */}
          {isAdmin && !isUnassigned && (
            <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Transfer Case
            </Button>
          )}
          {/* Update Status Button (Agent/Admin, assigned cases) */}
          {isAgent && !isUnassigned && (
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Case Status</DialogTitle>
                  <DialogDescription>Change the status of this case</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                    <Label>Note (optional)</Label>
                    <Textarea
                      placeholder="Add a note about this status change..."
                      value={statusNote}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setStatusNote(e.target.value)
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                    Update Status
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRejectReason(e.target.value)
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
                setSelectedDocId('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRejectDocument(selectedDocId, rejectReason)}
              disabled={!rejectReason.trim()}
            >
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({caseData.documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {isAgent && <TabsTrigger value="notes">Internal Notes</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={Briefcase}
                  label="Status"
                  value={<Badge>{caseData.status.replace(/_/g, ' ')}</Badge>}
                />
                <InfoRow
                  icon={Calendar}
                  label="Submitted"
                  value={new Date(caseData.submissionDate).toLocaleDateString()}
                />
                <InfoRow
                  icon={Clock}
                  label="Last Updated"
                  value={new Date(caseData.lastUpdated).toLocaleDateString()}
                />
                <InfoRow icon={Flag} label="Priority" value={caseData.priority} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={User}
                  label="Name"
                  value={
                    caseData.client?.firstName || caseData.client?.lastName
                      ? `${caseData.client?.firstName ?? ''} ${caseData.client?.lastName ?? ''}`.trim()
                      : '—'
                  }
                />
                <InfoRow icon={Mail} label="Email" value={caseData.client?.email || 'N/A'} />
                <InfoRow icon={Phone} label="Phone" value={caseData.client?.phone || 'N/A'} />
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.filePath, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAgent && doc.status === 'PENDING' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveDocument(doc.id)}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedDocId(doc.id);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </>
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
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline & Transfer History</CardTitle>
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
                      This case has not been assigned to an agent yet. Transfer history will appear
                      here once the case is assigned and transferred.
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
                <CardTitle>Internal Notes</CardTitle>
                <CardDescription>Notes visible only to agents and admins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Add internal note..."
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
                    {savingNote ? 'Saving...' : 'Save Note'}
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
                    <p className="text-sm text-muted-foreground">No internal notes yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
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
