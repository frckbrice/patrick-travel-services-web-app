'use client';

import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { FileText, MessageSquare, Bell, Briefcase, ArrowRight, CheckCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function DashboardHome() {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    const stats = [
        {
            label: t('dashboard.activeCases'),
            value: '12',
            change: '+2 this week',
            icon: Briefcase,
            trend: 'up'
        },
        {
            label: t('dashboard.pendingDocuments'),
            value: '5',
            change: '3 need review',
            icon: FileText,
            trend: 'neutral'
        },
        {
            label: t('dashboard.newMessages'),
            value: '8',
            change: '2 unread',
            icon: MessageSquare,
            trend: 'up'
        },
        {
            label: t('dashboard.notifications'),
            value: '15',
            change: '5 new today',
            icon: Bell,
            trend: 'up'
        },
    ];

    const quickActions = [
        { label: 'Submit New Case', icon: Briefcase, href: '/dashboard/cases/new' },
        { label: 'Upload Document', icon: Upload, href: '/dashboard/documents' },
        { label: 'Send Message', icon: MessageSquare, href: '/dashboard/messages' },
    ];

    const recentActivity = [
        {
            icon: CheckCircle,
            title: 'Case Updated',
            description: 'Student Visa application status changed',
            time: '2 hours ago',
            variant: 'success' as const,
        },
        {
            icon: Upload,
            title: 'Document Uploaded',
            description: 'Passport copy received',
            time: '5 hours ago',
            variant: 'default' as const,
        },
        {
            icon: MessageSquare,
            title: 'New Message',
            description: 'Agent replied to your query',
            time: '1 day ago',
            variant: 'secondary' as const,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('dashboard.welcomeBack')}, {user?.firstName}!
                </h1>
                <p className="text-muted-foreground mt-2">
                    Here's what's happening with your immigration cases today.
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
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.change}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={action.href}
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link href={action.href}>
                                        <Icon className="mr-2 h-4 w-4" />
                                        {action.label}
                                    </Link>
                                </Button>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                        <CardDescription>Latest updates and changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => {
                                const Icon = activity.icon;
                                return (
                                    <div key={index}>
                                        <div className="flex items-start space-x-4">
                                            <div className="mt-1">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {activity.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {activity.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {activity.time}
                                                </p>
                                            </div>
                                        </div>
                                        {index < recentActivity.length - 1 && (
                                            <Separator className="my-4" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cases Overview for Admin/Agent */}
            {user?.role !== 'CLIENT' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cases Overview</CardTitle>
                        <CardDescription>Manage all client cases</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                                Cases list will be displayed here
                            </p>
                            <Button variant="link" asChild className="mt-2">
                                <Link href="/dashboard/cases">
                                    {t('dashboard.viewAll')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
