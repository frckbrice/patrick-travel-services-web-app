import { Suspense } from 'react';
import { RoleCasesList } from '@/features/cases/components/RoleCasesList';
import { CasesListSkeleton } from '@/features/cases/components/CasesList';

export default function CasesPage() {
  return (
    <Suspense fallback={<CasesListSkeleton />}>
      <RoleCasesList />
    </Suspense>
  );
}
