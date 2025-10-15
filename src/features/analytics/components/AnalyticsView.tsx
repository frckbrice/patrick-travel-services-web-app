'use client';

import { useAuthStore } from '@/features/auth/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, FileCheck, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AnalyticsView() {
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

    const stats = [
        {
            label: 'Total Cases',
            value: '156',
            trend: '+12%',
            icon: BarChart3,
            description: 'All time cases'
        },
        {
            label: 'Active Cases',
            value: '48',
            trend: '+8%',
            icon: TrendingUp,
            description: 'Currently processing'
        },
        {
            label: 'Approved Cases',
            value: '92',
            trend: '+15%',
            icon: FileCheck,
            description: 'Successfully approved'
        },
        {
            label: 'Success Rate',
            value: '94%',
            trend: '+3%',
            icon: Target,
            description: 'Approval percentage'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Analytics
                </h1>
                <p className="text-muted-foreground mt-2">
                    Track performance and case statistics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.label}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                        {stat.trend}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {stat.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts */}
            <Tabs defaultValue="status" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="status">By Status</TabsTrigger>
                    <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
                    <TabsTrigger value="types">Case Types</TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cases by Status</CardTitle>
                            <CardDescription>Distribution of cases across different statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Chart placeholder - integrate Recharts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Trends</CardTitle>
                            <CardDescription>Case volume and approval trends over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Chart placeholder - integrate Recharts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="types" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Case Types Distribution</CardTitle>
                            <CardDescription>Breakdown by visa type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Chart placeholder - integrate Recharts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
