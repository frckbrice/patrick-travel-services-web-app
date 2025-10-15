import { Suspense } from 'react';
import { NotificationsList } from '@/features/notifications/components/NotificationsList';
import DashboardLoading from '../loading';

export default function NotificationsPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <NotificationsList />
        </Suspense>
    );
}

