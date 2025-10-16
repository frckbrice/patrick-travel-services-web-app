import { Suspense } from 'react';
import { NotificationsList, NotificationsListSkeleton } from '@/features/notifications/components/NotificationsListEnhanced-API';

export default function NotificationsPage() {
    return (
        <Suspense fallback={<NotificationsListSkeleton />}>
            <NotificationsList />
        </Suspense>
    );
}
