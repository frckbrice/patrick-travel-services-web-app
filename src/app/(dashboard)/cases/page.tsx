import { Suspense } from 'react';
import { CasesList, CasesListSkeleton } from '@/features/cases/components/CasesList';

export default function CasesPage() {
    return (
        <Suspense fallback={<CasesListSkeleton />}>
            <CasesList />
        </Suspense>
    );
}
