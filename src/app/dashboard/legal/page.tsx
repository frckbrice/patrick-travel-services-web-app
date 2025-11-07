import { Suspense } from 'react';
import DashboardLoading from '../loading';
import { LegalManagement } from '@/features/legal/components/LegalManagement';

export default function LegalPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <LegalManagement />
    </Suspense>
  );
}
