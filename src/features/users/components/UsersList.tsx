'use client';

import { useAuthStore } from '@/features/auth/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export function UsersList() {
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t('users.title')} Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage system users and permissions
                    </p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('users.addUser')}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="text-base">Filter Users</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-8 w-[250px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            {['all', 'client', 'agent', 'admin'].map((role) => (
                                <TabsTrigger key={role} value={role} className="capitalize">
                                    {role}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        Users
                    </CardTitle>
                    <CardDescription>
                        View and manage all system users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>{t('users.role')}</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Users className="h-8 w-8 mb-2 opacity-50" />
                                        <p>No users found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
