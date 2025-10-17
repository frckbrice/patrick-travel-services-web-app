'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../api';
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/mutations';
import { Bell, CheckCheck, Briefcase, MessageSquare, FileText, CheckCircle2, AlertCircle, User, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    actionUrl?: string;
}

const notifConfig: Record<string, { icon: any; className: string }> = {
    CASE_STATUS_UPDATE: { icon: Briefcase, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    NEW_MESSAGE: { icon: MessageSquare, className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    DOCUMENT_UPLOADED: { icon: FileText, className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    DOCUMENT_VERIFIED: { icon: CheckCircle2, className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    DOCUMENT_REJECTED: { icon: AlertCircle, className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    CASE_ASSIGNED: { icon: User, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    SYSTEM_ANNOUNCEMENT: { icon: Bell, className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export function NotificationsList() {
    const { t } = useTranslation();
    const router = useRouter();
    const [filterType, setFilterType] = useState<string>('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    
    const { data, isLoading, error, refetch } = useNotifications(showUnreadOnly);
    const markAsRead = useMarkNotificationRead();
    const markAllAsRead = useMarkAllNotificationsRead();
    
    if (isLoading) return <NotificationsListSkeleton />;
    if (error) return <div className="text-center py-12"><p className="text-red-600">{t('notifications.errorLoading')}</p></div>;

    const notifications: Notification[] = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;
    const filtered = notifications.filter((n: Notification) => filterType === 'all' || n.type === filterType);

    const formatTime = (date: string) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return t('notifications.invalidDate');
        const now = new Date();
        const hours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
        if (hours < 1) return t('notifications.justNow');
        if (hours < 24) return t('notifications.hoursAgo', { hours });
        const days = Math.floor(hours / 24);
        if (days === 1) return t('notifications.yesterday');
        if (days < 7) return t('notifications.daysAgo', { days });
        return d.toLocaleDateString();
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead.mutateAsync(id);
            refetch();
        } catch (error) {
            logger.error('Failed to mark notification as read:', error);
            toast.error(t('notifications.markAsReadError'));
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead.mutateAsync();
            refetch();
        } catch (error) {
            logger.error('Failed to mark all notifications as read:', error);
            toast.error(t('notifications.markAllAsReadError'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{t('notifications.pageTitle')}</h1>
                        {unreadCount > 0 && <Badge variant="default">{unreadCount} {t('notifications.unread')}</Badge>}
                    </div>
                    <p className="text-muted-foreground mt-2">{t('notifications.pageSubtitle')}</p>
                </div>
                {unreadCount > 0 && <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markAllAsRead.isPending}><CheckCheck className="mr-2 h-4 w-4" />{t('notifications.markAllAsRead')}</Button>}
            </div>
            <Card><CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-[250px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('notifications.filters.all')}</SelectItem>
                            <SelectItem value="CASE_STATUS_UPDATE">{t('notifications.filters.caseUpdates')}</SelectItem>
                            <SelectItem value="NEW_MESSAGE">{t('notifications.filters.messages')}</SelectItem>
                            <SelectItem value="DOCUMENT_VERIFIED">{t('notifications.filters.documentVerified')}</SelectItem>
                            <SelectItem value="DOCUMENT_REJECTED">{t('notifications.filters.documentRejected')}</SelectItem>
                            <SelectItem value="SYSTEM_ANNOUNCEMENT">{t('notifications.filters.announcements')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant={showUnreadOnly ? 'default' : 'outline'} onClick={() => setShowUnreadOnly(!showUnreadOnly)}>{showUnreadOnly ? t('notifications.showingUnread') : t('notifications.showUnreadOnly')}</Button>
                </div>
            </CardContent></Card>
            {filtered.length === 0 ? (
                <Card><CardContent className="py-12 text-center"><Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">{t('notifications.noNotifications')}</h3><p className="text-muted-foreground">{showUnreadOnly || filterType !== 'all' ? t('notifications.noMatchingFilters') : t('notifications.allCaughtUp')}</p></CardContent></Card>
            ) : (
                <div className="space-y-2">
                        {filtered.map((notif: Notification) => {
                        const Icon = notifConfig[notif.type]?.icon || Bell;

                            const handleNotificationClick = async () => {
                                try {
                                    // Mark as read if unread, and wait for it to complete
                                    if (!notif.isRead) {
                                        await handleMarkAsRead(notif.id);
                                    }
                                } catch (error) {
                                    // Log error but don't block navigation
                                    logger.error('Error marking notification as read:', error);
                                }

                                // Navigate if actionUrl exists
                                if (notif.actionUrl) {
                                    router.push(notif.actionUrl);
                                }
                            };

                        return (
                            <Card key={notif.id} className={cn('hover:shadow-md transition-all cursor-pointer', !notif.isRead && 'border-l-4 border-l-primary bg-muted/30')} onClick={handleNotificationClick}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className={cn('p-3 rounded-lg', notifConfig[notif.type]?.className || '')}><Icon className="h-5 w-5" /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold">{notif.title}</h3>
                                                {!notif.isRead && <span className="flex-shrink-0 h-2 w-2 bg-primary rounded-full mt-2" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{formatTime(notif.createdAt)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function NotificationsListSkeleton() {
    return <div className="space-y-6"><div className="flex justify-between"><div><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-96 mt-2" /></div><Skeleton className="h-10 w-40" /></div><Card><CardContent className="pt-6"><div className="flex gap-4"><Skeleton className="h-10 w-[250px]" /><Skeleton className="h-10 w-40" /></div></CardContent></Card><div className="space-y-2">{[1,2,3,4,5].map(i => <Card key={i}><CardContent className="pt-6"><div className="flex gap-4"><Skeleton className="h-12 w-12 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-24" /></div></div></CardContent></Card>)}</div></div>;
}
