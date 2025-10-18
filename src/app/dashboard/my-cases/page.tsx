import { Suspense } from 'react';
import { CasesList, CasesListSkeleton } from '@/features/cases/components/CasesList';

// PERFORMANCE: Client-specific cases view with optimized loading
export default function MyCasesPage() {
  return (
    <Suspense fallback={<CasesListSkeleton />}>
      <CasesList />
    </Suspense>
  );
}
