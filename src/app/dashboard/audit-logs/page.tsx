import { Suspense } from 'react';
import { AuditLogsListEnhanced } from '@/features/audit/components/AuditLogsListEnhanced';
import DashboardLoading from '../loading';

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuditLogsListEnhanced />
    </Suspense>
  );
}
