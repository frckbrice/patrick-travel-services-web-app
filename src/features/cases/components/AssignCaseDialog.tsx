'use client';

import { useState, useMemo } from 'react';
import { useUsers } from '@/features/users/api';
import { useCases } from '@/features/cases/api';
import { useAssignCase } from '../api/mutations';
import type { Case } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCheck, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';

interface AssignCaseDialogProps {
    caseData: Case;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AssignCaseDialog({ caseData, open, onOpenChange, onSuccess }: AssignCaseDialogProps) {
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');

    const { data: usersData, isLoading: isLoadingUsers } = useUsers({ role: 'AGENT' });
    const { data: casesData, isLoading: isLoadingCases } = useCases({});
    const assignCase = useAssignCase();

    const agents = usersData?.users || [];
    const allCases = casesData?.cases || [];

    // Calculate agent workload and availability
    const agentsWithMetrics = useMemo(() => {
        return agents.map((agent: any) => {
            const assignedCases = allCases.filter((c: any) => c.assignedAgentId === agent.id);
            const activeCases = assignedCases.filter((c: any) =>
                !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status)
            );

            // Calculate capacity (max 20 active cases per agent)
            const maxCapacity = 20;
            const currentLoad = activeCases.length;
            const utilizationRate = (currentLoad / maxCapacity) * 100;
            const availableCapacity = maxCapacity - currentLoad;
            const isAvailable = availableCapacity > 0;

            // Calculate success metrics
            const completedCases = assignedCases.filter((c: any) => c.status === 'APPROVED');
            const approvalRate = assignedCases.length > 0
                ? Math.round((completedCases.length / assignedCases.length) * 100)
                : 0;

            return {
                ...agent,
                metrics: {
                    activeCases: currentLoad,
                    maxCapacity,
                    utilizationRate,
                    availableCapacity,
                    isAvailable,
                    approvalRate,
                    totalCases: assignedCases.length,
                }
            };
        });
    }, [agents, allCases]);

    // Sort agents by availability (most available first)
    const sortedAgents = useMemo(() => {
        return [...agentsWithMetrics].sort((a, b) => {
            // First: available agents
            if (a.metrics.isAvailable !== b.metrics.isAvailable) {
                return a.metrics.isAvailable ? -1 : 1;
            }
            // Second: by available capacity (more capacity first)
            if (a.metrics.availableCapacity !== b.metrics.availableCapacity) {
                return b.metrics.availableCapacity - a.metrics.availableCapacity;
            }
            // Third: by approval rate (higher is better)
            return b.metrics.approvalRate - a.metrics.approvalRate;
        });
    }, [agentsWithMetrics]);

    const selectedAgent = sortedAgents.find(a => a.id === selectedAgentId);

    const handleAssign = async () => {
        if (!selectedAgentId) {
            toast.error('Please select an agent');
            return;
        }

        try {
            await assignCase.mutateAsync({
                caseId: caseData.id,
                agentId: selectedAgentId
            });

            toast.success('Case assigned successfully');
            setSelectedAgentId('');
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            // Error is handled in mutation
        }
    };

    const getUtilizationColor = (rate: number) => {
        if (rate >= 90) return 'text-red-600 dark:text-red-400';
        if (rate >= 70) return 'text-orange-600 dark:text-orange-400';
        if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getAvailabilityBadge = (agent: any) => {
        if (!agent.metrics.isAvailable) {
            return <Badge variant="destructive">At Capacity</Badge>;
        }
        if (agent.metrics.utilizationRate >= 80) {
            return <Badge variant="secondary">Limited</Badge>;
        }
        return <Badge variant="default">Available</Badge>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign Case to Agent</DialogTitle>
                    <DialogDescription>
                        Select an immigration agent to handle this case
                    </DialogDescription>
                </DialogHeader>

                {/* Current Case Info */}
                <div className="rounded-lg border p-4 bg-muted/50">
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
                </div>

                {/* Agent Selection */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="agent-select">Select Agent *</Label>
                        {isLoadingUsers || isLoadingCases ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : (
                            <>
                                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                    <SelectTrigger id="agent-select">
                                        <SelectValue placeholder="Choose an agent..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortedAgents.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No agents available
                                            </div>
                                        ) : (
                                            sortedAgents.map((agent) => (
                                                <SelectItem key={agent.id} value={agent.id}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>
                                                            {agent.firstName} {agent.lastName}
                                                        </span>
                                                        <span className="ml-2">
                                                            ({agent.metrics.activeCases}/{agent.metrics.maxCapacity} cases)
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>

                                {/* Agent Preview */}
                                {selectedAgent && (
                                    <div className="rounded-lg border p-4 space-y-3 bg-background">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback>
                                                    {getInitials(`${selectedAgent.firstName} ${selectedAgent.lastName}`)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold">
                                                            {selectedAgent.firstName} {selectedAgent.lastName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {selectedAgent.email}
                                                        </p>
                                                    </div>
                                                    {getAvailabilityBadge(selectedAgent)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-3 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Workload</p>
                                                <p className={`text-lg font-bold ${getUtilizationColor(selectedAgent.metrics.utilizationRate)}`}>
                                                    {selectedAgent.metrics.utilizationRate.toFixed(0)}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedAgent.metrics.activeCases} active
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Available</p>
                                                <p className="text-lg font-bold">
                                                    {selectedAgent.metrics.availableCapacity}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    slots open
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Success Rate</p>
                                                <p className="text-lg font-bold">
                                                    {selectedAgent.metrics.approvalRate}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedAgent.metrics.totalCases} total
                                                </p>
                                            </div>
                                        </div>

                                        {/* Availability Indicator */}
                                        <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                                            {selectedAgent.metrics.isAvailable ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm">
                                                        <p className="font-medium">Agent is available</p>
                                                        <p className="text-muted-foreground">
                                                            Can handle {selectedAgent.metrics.availableCapacity} more case{selectedAgent.metrics.availableCapacity !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm">
                                                        <p className="font-medium">Agent at capacity</p>
                                                        <p className="text-muted-foreground">
                                                            Currently handling {selectedAgent.metrics.activeCases} active cases
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Helper Text */}
                    {!isLoadingUsers && !isLoadingCases && sortedAgents.length > 0 && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 text-sm">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                    Smart Sorting Enabled
                                </p>
                                <p className="text-blue-700 dark:text-blue-300">
                                    Agents are sorted by availability, workload, and success rate
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSelectedAgentId('');
                            onOpenChange(false);
                        }}
                        disabled={assignCase.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedAgentId || assignCase.isPending || !selectedAgent?.metrics.isAvailable}
                    >
                        <UserCheck className="mr-2 h-4 w-4" />
                        {assignCase.isPending ? 'Assigning...' : 'Assign Case'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

