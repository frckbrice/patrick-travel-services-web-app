import { Suspense } from 'react';
import { CasesList } from '@/features/cases/components/CasesList';
import DashboardLoading from '../loading';

export default function CasesPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <CasesList />
        </Suspense>
    );
}

