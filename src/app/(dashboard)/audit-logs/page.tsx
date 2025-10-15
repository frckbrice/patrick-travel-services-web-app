import { Suspense } from 'react';
import { AuditLogsList } from '@/features/audit/components/AuditLogsList';
import DashboardLoading from '../loading';

export default function AuditLogsPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <AuditLogsList />
        </Suspense>
    );
}
