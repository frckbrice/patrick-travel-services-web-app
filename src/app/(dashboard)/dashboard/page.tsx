import { Suspense } from 'react';
import { DashboardHome } from '@/features/dashboard/components/DashboardHome';
import DashboardLoading from '../loading';

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardHome />
        </Suspense>
    );
}
