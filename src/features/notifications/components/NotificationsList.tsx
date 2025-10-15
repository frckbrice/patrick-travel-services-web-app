'use client';

import { useTranslation } from 'react-i18next';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function NotificationsList() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t('dashboard.notifications')}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Stay updated with all your case activities
                    </p>
                </div>
                <Button variant="outline">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark All as Read
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">
                                All
                            </TabsTrigger>
                            <TabsTrigger value="unread">
                                Unread
                            </TabsTrigger>
                            <TabsTrigger value="read">
                                Read
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
            </Card>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Bell className="mr-2 h-5 w-5" />
                        Recent Notifications
                    </CardTitle>
                    <CardDescription>
                        You have 0 unread notifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Empty State */}
                    <div className="text-center py-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <BellOff className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            You&apos;re all caught up! We&apos;ll notify you when something new happens.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
