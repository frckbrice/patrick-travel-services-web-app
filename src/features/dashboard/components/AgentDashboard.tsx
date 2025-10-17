'use client';

import { useAuthStore } from '@/features/auth/store';
import { useCases } from '@/features/cases/api';
import { Case } from '@/features/cases/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle2, Clock, TrendingUp, Users, FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function AgentDashboard() {
    const { user } = useAuthStore();
    const { data: casesData, isLoading } = useCases({});
    
    if (isLoading) return <AgentDashboardSkeleton />;

    const cases: Case[] = casesData?.cases || [];
    const assignedCases = cases.filter((c: Case) => c.assignedAgentId === user?.id);
    const activeAssigned = assignedCases.filter((c: Case) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status));
    const completedThisMonth = assignedCases.filter((c: Case) => {
        if (c.status !== 'APPROVED') return false;

        // Use dedicated completion timestamp: completedAt or approvedAt, fallback to lastUpdated
        const completionTimestamp = c.completedAt || c.approvedAt || c.lastUpdated;
        if (!completionTimestamp) return false;

        const completedDate = new Date(completionTimestamp);
        // Guard against invalid dates
        if (isNaN(completedDate.getTime())) return false;

        const now = new Date();
        return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
    });

    // Calculate documents requiring verification (PENDING status)
    const documentsToVerify = assignedCases.reduce((count: number, c: Case) => {
        if (c.documents && Array.isArray(c.documents)) {
            return count + c.documents.filter((doc) => doc.status === 'PENDING').length;
        }
        return count;
    }, 0);

    // Calculate average response time
    const calculateResponseTime = (): string => {
        // Filter cases that have been updated after submission (excluding just-submitted cases)
        const processedCases = assignedCases.filter((c: Case) => {
            const submitted = new Date(c.submissionDate);
            const updated = new Date(c.lastUpdated);
            return updated.getTime() - submitted.getTime() > 60000; // More than 1 minute difference
        });

        if (processedCases.length === 0) return 'N/A';

        // Calculate average time difference in milliseconds
        const totalResponseTime = processedCases.reduce((total: number, c: Case) => {
            const submitted = new Date(c.submissionDate);
            const updated = new Date(c.lastUpdated);
            return total + (updated.getTime() - submitted.getTime());
        }, 0);

        const avgResponseTimeMs = totalResponseTime / processedCases.length;
        const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

        // Format the response time
        if (avgResponseTimeHours < 1) {
            const minutes = Math.round(avgResponseTimeMs / (1000 * 60));
            return `${minutes} min${minutes !== 1 ? 's' : ''}`;
        } else if (avgResponseTimeHours < 24) {
            return `${avgResponseTimeHours.toFixed(1)} hrs`;
        } else {
            const days = avgResponseTimeHours / 24;
            return `${days.toFixed(1)} days`;
        }
    };

    const stats = {
        assignedCases: assignedCases.length,
        activeCases: activeAssigned.length,
        completedThisMonth: completedThisMonth.length,
        pendingReview: assignedCases.filter((c: Case) => c.status === 'UNDER_REVIEW').length,
        documentsToVerify,
        responseTime: calculateResponseTime(),
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
                <p className="text-muted-foreground mt-2">Here is your agent dashboard overview</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Cases</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.assignedCases}</div>
                        <p className="text-xs text-muted-foreground">{stats.activeCases} active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingReview}</div>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed (This Month)</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
                        <p className="text-xs text-muted-foreground">Successfully closed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.responseTime}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.responseTime === 'N/A' ? 'No data available' : 'Average across all cases'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader><CardTitle>Recent Cases</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {activeAssigned.slice(0, 5).map((c: Case) => (
                            <div key={c.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">{c.referenceNumber}</p>
                                        <p className="text-xs text-muted-foreground">{c.client?.firstName} {c.client?.lastName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{c.status.replace(/_/g, ' ')}</Badge>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/dashboard/cases/${c.id}`}>Review</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {activeAssigned.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>No active cases assigned</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/cases"><Briefcase className="mr-2 h-4 w-4" />My Cases</Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/documents"><FileCheck className="mr-2 h-4 w-4" />Review Documents</Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/clients"><Users className="mr-2 h-4 w-4" />My Clients</Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/messages"><AlertCircle className="mr-2 h-4 w-4" />Urgent Messages</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function AgentDashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div><Skeleton className="h-9 w-64" /><Skeleton className="h-5 w-96 mt-2" /></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1,2,3,4].map(i => <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /><Skeleton className="h-3 w-20 mt-2" /></CardContent></Card>)}
            </div>
        </div>
    );
}
