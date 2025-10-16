'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Search, Calendar, Clock, User, FileText, MessageSquare, Edit } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
    SUBMITTED: { label: 'New Submission', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    DOCUMENTS_REQUIRED: { label: 'Awaiting Documents', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const serviceLabels: Record<string, string> = {
    STUDENT_VISA: 'Student Visa', WORK_PERMIT: 'Work Permit', FAMILY_REUNIFICATION: 'Family Reunification',
    TOURIST_VISA: 'Tourist Visa', BUSINESS_VISA: 'Business Visa', PERMANENT_RESIDENCY: 'Permanent Residency',
};

export function AgentCasesList() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('active');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    
    const { data, isLoading, error } = useCases({ status: statusFilter !== 'all' ? statusFilter : undefined });
    
    if (isLoading) return <AgentCasesListSkeleton />;
    if (error) return <div className="text-center py-12"><p className="text-red-600">Error loading cases</p></div>;

    let cases = data?.cases || [];
    
    // Filter to assigned cases only
    cases = cases.filter((c: any) => c.assignedAgentId === user?.id);
    
    // Active filter
    if (statusFilter === 'active') {
        cases = cases.filter((c: any) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status));
    }
    
    // Search and priority filter
    cases = cases.filter((c: any) => {
        const matchesSearch = searchQuery === '' || 
            c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${c.client?.firstName} ${c.client?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Cases</h1>
                    <p className="text-muted-foreground mt-2">Manage your assigned immigration cases</p>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2">
                    {cases.length} Cases
                </Badge>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by reference or client name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full lg:w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active Cases</SelectItem>
                                <SelectItem value="all">All Cases</SelectItem>
                                <SelectItem value="SUBMITTED">New Submissions</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="DOCUMENTS_REQUIRED">Awaiting Documents</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full lg:w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {cases.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                    <p className="text-muted-foreground">No cases match your current filters</p>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4">
                    {cases.map((c: any) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="flex items-center gap-2">
                                                <Briefcase className="h-5 w-5 text-primary" />{c.referenceNumber}
                                            </CardTitle>
                                            <Badge className={cn('flex items-center gap-1', priorityConfig[c.priority]?.color || '')}>
                                                {priorityConfig[c.priority]?.label || c.priority}
                                            </Badge>
                                        </div>
                                        <CardDescription className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            {c.client?.firstName} {c.client?.lastName} • {serviceLabels[c.serviceType] || c.serviceType}
                                        </CardDescription>
                                    </div>
                                    <Badge className={cn(statusConfig[c.status]?.color || '')}>
                                        {statusConfig[c.status]?.label || c.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Submitted:</span>
                                        <span>{new Date(c.submissionDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{new Date(c.lastUpdated).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span>{c.documents?.length || 0} docs</span>
                                        <MessageSquare className="h-4 w-4 ml-2" />
                                        <span>{c.messages?.length || 0} msgs</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="default" size="sm" className="flex-1">
                                        <Link href={`/dashboard/cases/${c.id}`}><Edit className="mr-2 h-4 w-4" />Manage Case</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/messages?case=${c.id}`}>Message Client</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export function AgentCasesListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between"><div><Skeleton className="h-9 w-32" /><Skeleton className="h-5 w-64 mt-2" /></div><Skeleton className="h-10 w-24" /></div>
            <Card><CardContent className="pt-6"><div className="flex gap-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-[200px]" /><Skeleton className="h-10 w-[150px]" /></div></CardContent></Card>
            <div className="grid gap-4">{[1,2,3].map(i => <Card key={i}><CardHeader><Skeleton className="h-6 w-full" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>
        </div>
    );
}
