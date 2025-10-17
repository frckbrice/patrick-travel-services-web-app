'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useUsers } from '@/features/users/api';
import { useCases } from '@/features/cases/api';
import { UserPlus, Users, Search, Mail, Phone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { getInitials } from '@/lib/utils/helpers';

export function ClientsList() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 12 cards fit nicely in grid (3x4 on desktop, 2x6 on tablet, 1x12 on mobile)

    const { data: usersData, isLoading: isLoadingUsers, error } = useUsers({ role: 'CLIENT' });
    const { data: casesData, isLoading: isLoadingCases } = useCases({});

    useEffect(() => {
        // Only ADMIN and AGENT can access this page
        if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
        return null;
    }

    const isLoading = isLoadingUsers || isLoadingCases;
    if (isLoading) return <ClientsListSkeleton />;

    const allClients = usersData?.users || [];
    const allCases = casesData?.cases || [];

    // Memoized filtered clients for better performance
    const filteredClients = useMemo(() => {
        // For ADMIN: show all clients
        // For AGENT: show only clients with assigned cases
        let clients = allClients;
        if (user?.role === 'AGENT') {
            // Get cases assigned to this agent
            const assignedCases = allCases.filter((c: any) => c.assignedAgentId === user.id);
            // Get unique client IDs from assigned cases
            const assignedClientIds = new Set(assignedCases.map((c: any) => c.clientId));
            // Filter clients to show only those with assigned cases
            clients = allClients.filter((client: any) => assignedClientIds.has(client.id));
        }

        // Apply search filter
        return clients.filter((client: any) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                client.firstName?.toLowerCase().includes(query) ||
                client.lastName?.toLowerCase().includes(query) ||
                client.email?.toLowerCase().includes(query)
            );
        });
    }, [allClients, allCases, user?.role, user?.id, searchQuery]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {user?.role === 'AGENT' ? 'My Clients' : 'All Clients'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {user?.role === 'AGENT'
                            ? 'Clients with cases assigned to you'
                            : 'Manage all client accounts and information'}
                    </p>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2">
                    {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
                </Badge>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Clients List */}
            {filteredClients.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">
                            {searchQuery ? 'No clients found' : 'No clients yet'}
                        </h3>
                        <p className="text-muted-foreground">
                            {searchQuery ? 'Try adjusting your search' : 'Clients will appear here when they register'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {paginatedClients.map((client: any) => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>
                                                {getInitials(`${client.firstName} ${client.lastName}`)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">
                                                {client.firstName} {client.lastName}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                CLIENT
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={client.isActive ? 'default' : 'secondary'}>
                                        {client.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>Joined {new Date(client.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="pt-2">
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/dashboard/clients/${client.id}`}>View Profile</Link>
                                    </Button>
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
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} of {filteredClients.length}
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

export function ClientsListSkeleton() {
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
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
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
