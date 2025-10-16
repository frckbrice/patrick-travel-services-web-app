import { Suspense } from 'react';
import { DashboardHome, DashboardHomeSkeleton } from '@/features/dashboard/components/DashboardHome';
import { AgentDashboard, AgentDashboardSkeleton } from '@/features/dashboard/components/AgentDashboard';
import { RoleDashboard } from '@/features/dashboard/components/RoleDashboard';

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardHomeSkeleton />}>
            <RoleDashboard />
        </Suspense>
    );
}
