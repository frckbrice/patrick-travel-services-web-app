'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '../api';
import { Case } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Search, Plus, Calendar, Clock, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
    SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    DOCUMENTS_REQUIRED: { label: 'Documents Required', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    PROCESSING: { label: 'Processing', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
};

const serviceLabels: Record<string, string> = {
    STUDENT_VISA: 'Student Visa', WORK_PERMIT: 'Work Permit', FAMILY_REUNIFICATION: 'Family Reunification',
    TOURIST_VISA: 'Tourist Visa', BUSINESS_VISA: 'Business Visa', PERMANENT_RESIDENCY: 'Permanent Residency',
};

export function CasesList() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Optimized for mobile performance

    const { data, isLoading, error } = useCases({ status: statusFilter !== 'all' ? statusFilter : undefined });

    if (isLoading) return <CasesListSkeleton />;
    if (error) return <div className="text-center py-12"><p className="text-red-600">Error loading cases. Please try again.</p></div>;

    const cases: Case[] = data?.cases || [];

    // Memoize filtered results for performance
    const filtered = useMemo(() =>
        cases.filter((c: Case) =>
            searchQuery === '' ||
            c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            serviceLabels[c.serviceType]?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [cases, searchQuery]
    );

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCases = filtered.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const isClient = user?.role === 'CLIENT';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{isClient ? 'My Cases' : 'Cases'}</h1>
                    <p className="text-muted-foreground mt-2">{isClient ? 'View and track your immigration cases' : 'Manage all immigration cases'}</p>
                </div>
                {!isClient && <Button asChild><Link href="/dashboard/cases/new"><Plus className="mr-2 h-4 w-4" />New Case</Link></Button>}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                aria-label="Search cases by reference number or service type"
                                placeholder="Search by reference or service type..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="DOCUMENTS_REQUIRED">Documents Required</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {filtered.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                    <p className="text-muted-foreground mb-4">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : isClient ? 'You do not have any cases yet' : 'No cases created yet'}</p>
                    {!isClient && <Button asChild><Link href="/dashboard/cases/new">Create First Case</Link></Button>}
                </CardContent></Card>
            ) : (
                <>
                    <div className="grid gap-4">
                        {paginatedCases.map((c: Case) => (
                            <Card key={c.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Briefcase className="h-5 w-5 text-primary" />{c.referenceNumber}
                                        </CardTitle>
                                        <CardDescription>{serviceLabels[c.serviceType] || c.serviceType}</CardDescription>
                                    </div>
                                    <Badge className={cn('flex items-center gap-1', statusConfig[c.status]?.className || '')}>
                                        {statusConfig[c.status]?.label || c.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Submitted:</span>
                                        <span>{new Date(c.submissionDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{new Date(c.lastUpdated).toLocaleDateString()}</span>
                                    </div>
                                    {c.assignedAgent && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Advisor:</span>
                                            <span>{c.assignedAgent.firstName} {c.assignedAgent.lastName}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{c.documents?.length || 0} documents</span>
                                    <Button asChild variant="outline" size="sm"><Link href={`/dashboard/cases/${c.id}`}>View Details</Link></Button>
                                </div>
                            </CardContent>
                        </Card>
                        ))}
                    </div>

                    {/* Pagination Controls - Mobile Optimized */}
                    {totalPages > 1 && (
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {startIndex + 1}-{Math.min(endIndex, filtered.length)} of {filtered.length}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="hidden sm:inline ml-1">Previous</span>
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => {
                                                    // Show first, last, current, and adjacent pages
                                                    return page === 1 ||
                                                        page === totalPages ||
                                                        Math.abs(page - currentPage) <= 1;
                                                })
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center">
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="px-2 text-muted-foreground">...</span>
                                                        )}
                                                        <Button
                                                            variant={currentPage === page ? 'default' : 'ghost'}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            {page}
                                                        </Button>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <span className="hidden sm:inline mr-1">Next</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

export function CasesListSkeleton() {
    return (
        <div className="space-y-6">
            <div><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-96 mt-2" /></div>
            <Card><CardContent className="pt-6"><div className="flex gap-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-[200px]" /></div></CardContent></Card>
            <div className="grid gap-4">{[1,2,3].map(i => <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-24 mt-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>
        </div>
    );
}
