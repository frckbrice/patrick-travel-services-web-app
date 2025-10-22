import { Suspense } from 'react';
import {
  NotificationsTable,
  NotificationsTableSkeleton,
} from '@/features/notifications/components/NotificationsTable';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsTableSkeleton />}>
      <NotificationsTable />
    </Suspense>
  );
}
