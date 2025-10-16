import { Suspense } from 'react';
import { NotificationsList, NotificationsListSkeleton } from '@/features/notifications/components/NotificationsListEnhanced';

export default function NotificationsPage() {
    return (
        <Suspense fallback={<NotificationsListSkeleton />}>
            <NotificationsList />
        </Suspense>
    );
}
