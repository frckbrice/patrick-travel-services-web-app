'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CasesList() {
    const [filter, setFilter] = useState('all');
    const { t } = useTranslation();

    const filters = ['all', 'submitted', 'under_review', 'processing', 'approved', 'rejected'];

    const getStatusVariant = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'submitted': 'secondary',
            'under_review': 'default',
            'processing': 'default',
            'approved': 'default',
            'rejected': 'destructive',
        };
        return variants[status] || 'outline';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t('cases.title')}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage and track all immigration cases
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/cases/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('cases.newCase')}
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter Cases
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={filter} onValueChange={setFilter} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                            {filters.map((status) => (
                                <TabsTrigger
                                    key={status}
                                    value={status}
                                    className="capitalize"
                                >
                                    {t(`cases.${status}`)}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Cases List */}
            <Card>
                <CardHeader>
                    <CardTitle>Cases</CardTitle>
                    <CardDescription>
                        {filter === 'all' ? 'All cases' : `${t(`cases.${filter}`)} cases`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Empty State */}
                    <div className="text-center py-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Filter className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No cases found</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Get started by creating your first case
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/dashboard/cases/new">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('cases.newCase')}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
