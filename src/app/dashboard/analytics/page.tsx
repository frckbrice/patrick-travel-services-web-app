import { Suspense } from 'react';
import { AnalyticsView } from '@/features/analytics/components/AnalyticsView';
import DashboardLoading from '../loading';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AnalyticsView />
    </Suspense>
  );
}
