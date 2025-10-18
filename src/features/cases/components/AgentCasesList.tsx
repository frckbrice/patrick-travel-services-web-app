'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useCases } from '../api';
import { AssignCaseDialog } from './AssignCaseDialog';
import type { Case } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  Edit,
  AlertTriangle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

const statusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: {
    label: 'New Submission',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  DOCUMENTS_REQUIRED: {
    label: 'Awaiting Documents',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NORMAL: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  HIGH: {
    label: 'High',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const serviceLabels: Record<string, string> = {
  STUDENT_VISA: 'Student Visa',
  WORK_PERMIT: 'Work Permit',
  FAMILY_REUNIFICATION: 'Family Reunification',
  TOURIST_VISA: 'Tourist Visa',
  BUSINESS_VISA: 'Business Visa',
  PERMANENT_RESIDENCY: 'Permanent Residency',
};

export function AgentCasesList() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all'); // all, assigned, unassigned
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<Case | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Optimized for mobile performance

  const { data, isLoading, error, refetch } = useCases({
    status: statusFilter !== 'all' && statusFilter !== 'active' ? statusFilter : undefined,
  });

  // Debounce search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  // Memoized filtered cases for better performance
  const filteredCases = useMemo(() => {
    if (!user?.id || !user?.role || !data?.cases) return [];
    let cases: Case[] = data.cases;

    // For AGENT: Filter to assigned cases only
    // For ADMIN: Show all cases OR filter based on assignment filter
    if (user.role === 'AGENT') {
      cases = cases.filter((c) => c.assignedAgentId === user.id);
    } else if (user.role === 'ADMIN') {
      if (assignmentFilter === 'unassigned') {
        cases = cases.filter((c) => !c.assignedAgentId);
      } else if (assignmentFilter === 'assigned') {
        cases = cases.filter((c) => !!c.assignedAgentId);
      }
    }

    // Active filter
    if (statusFilter === 'active') {
      cases = cases.filter((c) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status));
    }

    // Search and priority filter
    return cases.filter((c) => {
      const clientName = c.client
        ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim()
        : '';
      const matchesSearch =
        debouncedSearch === '' ||
        c.referenceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        clientName.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [
    data?.cases,
    user?.role,
    user?.id,
    assignmentFilter,
    statusFilter,
    debouncedSearch,
    priorityFilter,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // NOW safe to do conditional returns after all hooks have been called
  if (isLoading) return <AgentCasesListSkeleton />;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading cases</p>
      </div>
    );

  // Guard: Check if user ID is available before filtering
  if (!user?.id) {
    logger.warn('AgentCasesList: user.id is missing, cannot filter cases by assigned agent');
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Cases</h1>
            <p className="text-muted-foreground mt-2">Manage your assigned immigration cases</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Could Not Determine Current User</h3>
            <p className="text-muted-foreground mb-4">
              We&apos;re unable to identify your user account. Please try refreshing the page or logging
              in again.
            </p>
            <Button asChild variant="default">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.role === 'ADMIN' ? 'All Cases' : 'My Cases'}</h1>
          <p className="text-muted-foreground mt-2">
            {user.role === 'ADMIN'
              ? 'Manage all immigration cases and assignments'
              : 'Manage your assigned immigration cases'}
          </p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          {filteredCases.length} {filteredCases.length === 1 ? 'Case' : 'Cases'}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or client name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="pl-10"
              />
            </div>
            {user.role === 'ADMIN' && (
              <Select
                value={assignmentFilter}
                onValueChange={(value) => {
                  setAssignmentFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="unassigned">⚠️ Unassigned</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Cases</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">New Submissions</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="DOCUMENTS_REQUIRED">Awaiting Documents</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value) => {
                setPriorityFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue />
              </SelectTrigger>
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

      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
            <p className="text-muted-foreground">No cases match your current filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedCases.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          {c.referenceNumber}
                        </CardTitle>
                        <Badge
                          className={cn(
                            'flex items-center gap-1',
                            priorityConfig[c.priority]?.color || ''
                          )}
                        >
                          {priorityConfig[c.priority]?.label || c.priority}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {c.client?.firstName} {c.client?.lastName} •{' '}
                        {serviceLabels[c.serviceType] || c.serviceType}
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
                      <span>{c.documents?.length || 0} documents</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Quick Assign Button for ADMIN on unassigned cases */}
                    {user.role === 'ADMIN' && !c.assignedAgentId ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCaseForAssignment(c);
                          setAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign to Agent
                      </Button>
                    ) : (
                      <Button asChild variant="default" size="sm" className="flex-1">
                        <Link href={`/dashboard/cases/${c.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Manage Case
                        </Link>
                      </Button>
                    )}
                    {c.assignedAgentId && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/messages?case=${c.id}`}>Message Client</Link>
                      </Button>
                    )}
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
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredCases.length)} of{' '}
                    {filteredCases.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                          );
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
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Assign Case Dialog */}
      {selectedCaseForAssignment && (
        <AssignCaseDialog
          caseData={selectedCaseForAssignment}
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) setSelectedCaseForAssignment(null);
          }}
          onSuccess={() => {
            refetch();
            setSelectedCaseForAssignment(null);
          }}
        />
      )}
    </div>
  );
}

export function AgentCasesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
