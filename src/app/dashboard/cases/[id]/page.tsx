import { Suspense } from 'react';
import { CaseDetailView, CaseDetailSkeleton } from '@/features/cases/components/CaseDetailView';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<CaseDetailSkeleton />}>
      <CaseDetailView caseId={id} />
    </Suspense>
  );
}
