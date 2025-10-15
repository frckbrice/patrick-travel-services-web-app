'use client';

import { useAuthStore } from '@/features/auth/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FileText, Search, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AuditLogsList() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        // Only ADMIN can access this page
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Audit Logs
                </h1>
                <p className="text-muted-foreground mt-2">
                    Track all system activities and changes
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="text-base">Filter Logs</CardTitle>
                        <div className="relative w-full md:w-[300px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="user">User Actions</TabsTrigger>
                            <TabsTrigger value="system">System</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Activity Logs
                    </CardTitle>
                    <CardDescription>
                        Chronological record of all system events
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Empty State */}
                    <div className="text-center py-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Shield className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No audit logs available</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            System activities will be logged here for security and compliance
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
