'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUsers } from '@/features/users/api';
import { useTransferCase } from '../api/mutations';
import { useAuthStore } from '@/features/auth/store';
import type { Case } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RefreshCw, Info } from 'lucide-react';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';

interface CaseTransferDialogProps {
  caseData: Case;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const transferSchema = z.object({
  newAgentId: z.string().min(1, 'Please select an agent'),
  reason: z.enum(['REASSIGNMENT', 'COVERAGE', 'SPECIALIZATION', 'WORKLOAD', 'OTHER']),
  handoverNotes: z.string().optional(),
  notifyClient: z.boolean(),
  notifyAgent: z.boolean(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export function CaseTransferDialog({
  caseData,
  open,
  onOpenChange,
  onSuccess,
}: CaseTransferDialogProps) {
  const { user, isLoading: isAuthLoading, accessToken } = useAuthStore();

  // SECURITY FIX: Only fetch if dialog is open and user is ADMIN/AGENT with valid token
  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    { role: 'AGENT' },
    {
      enabled:
        open &&
        !isAuthLoading &&
        !!user &&
        !!accessToken &&
        (user.role === 'ADMIN' || user.role === 'AGENT'),
    }
  );
  const transferCase = useTransferCase();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      newAgentId: '',
      reason: 'REASSIGNMENT',
      handoverNotes: '',
      notifyClient: true,
      notifyAgent: true,
    },
  });

  const agents = usersData?.users || [];
  const selectedAgentId = form.watch('newAgentId');
  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);

  const onSubmit = async (data: TransferFormValues) => {
    try {
      await transferCase.mutateAsync({
        caseId: caseData.id,
        newAgentId: data.newAgentId,
        reason: data.reason,
        handoverNotes: data.handoverNotes,
        notifyClient: data.notifyClient,
        notifyAgent: data.notifyAgent,
      });

      toast.success('Case transferred successfully');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled in mutation
    }
  };

  const reasonLabels: Record<string, string> = {
    REASSIGNMENT: 'Permanent Reassignment',
    COVERAGE: 'Coverage (Vacation/Leave)',
    SPECIALIZATION: 'Specialization Required',
    WORKLOAD: 'Workload Balancing',
    OTHER: 'Other Reason',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Transfer Case to Another Agent
          </DialogTitle>
          <DialogDescription>Reassign this case to a different immigration agent</DialogDescription>
        </DialogHeader>

        {/* Current Case Info */}
        <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">Case: {caseData.referenceNumber}</p>
              <p className="text-sm text-muted-foreground">
                Client: {caseData.client?.firstName} {caseData.client?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                Service: {caseData.serviceType.replace(/_/g, ' ')}
              </p>
            </div>
            <Badge variant="outline">{caseData.status}</Badge>
          </div>
          {caseData.assignedAgent && (
            <div className="pt-2 border-t mt-2">
              <p className="text-xs text-muted-foreground">Current Agent</p>
              <p className="text-sm font-medium">
                {caseData.assignedAgent.firstName} {caseData.assignedAgent.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{caseData.assignedAgent.email}</p>
            </div>
          )}
        </div>

        {/* Transfer Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* New Agent Selection */}
            <FormField
              control={form.control}
              name="newAgentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Agent *</FormLabel>
                  {isLoadingUsers ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an agent..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agents
                          .filter((a: any) => a.id !== caseData.assignedAgentId && a.isActive)
                          .map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.firstName} {agent.lastName} ({agent.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Agent Preview */}
            {selectedAgent && (
              <div className="rounded-lg border p-4 bg-background space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(`${selectedAgent.firstName} ${selectedAgent.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedAgent.firstName} {selectedAgent.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedAgent.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Reason *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Handover Notes */}
            <FormField
              control={form.control}
              name="handoverNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handover Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide important context for the new agent..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share important case details, client preferences, or pending actions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notification Options */}
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Notification Options</p>

              <FormField
                control={form.control}
                name="notifyClient"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Notify client about agent change</FormLabel>
                      <FormDescription>
                        Client will receive an email with new agent contact information
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyAgent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Notify new agent</FormLabel>
                      <FormDescription>
                        New agent will receive email with case details and handover notes
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 text-sm">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Case Transfer Effects
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  The case will be immediately reassigned. The new agent will receive a notification
                  and the transfer will be logged in the case history.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={transferCase.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={transferCase.isPending || !form.formState.isValid}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${transferCase.isPending ? 'animate-spin' : ''}`}
                />
                {transferCase.isPending ? 'Transferring...' : 'Transfer Case'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
