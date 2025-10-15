'use client';

import { useAuthStore } from '@/features/auth/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ClientsList() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        // Only ADMIN and AGENT can access this page
        if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Clients
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage client accounts and information
                    </p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Client
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Search Clients</CardTitle>
                        <div className="relative w-[300px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Clients List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        All Clients
                    </CardTitle>
                    <CardDescription>
                        View and manage all client accounts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Empty State */}
                    <div className="text-center py-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Clients will appear here when they register
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
