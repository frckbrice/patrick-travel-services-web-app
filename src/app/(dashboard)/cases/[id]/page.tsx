import { Suspense } from 'react';
import { CaseDetailView, CaseDetailSkeleton } from '@/features/cases/components/CaseDetailView';

export default function CaseDetailPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<CaseDetailSkeleton />}>
            <CaseDetailView caseId={params.id} />
        </Suspense>
    );
}
