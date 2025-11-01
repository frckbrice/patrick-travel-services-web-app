import { Suspense } from 'react';
import {
  AuditLogsListEnhanced,
  AuditLogsListSkeleton,
} from '@/features/audit/components/AuditLogsListEnhanced';

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<AuditLogsListSkeleton />}>
      <AuditLogsListEnhanced />
    </Suspense>
  );
}
