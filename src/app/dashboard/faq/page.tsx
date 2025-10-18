import { Suspense } from 'react';
import { FAQManagement } from '@/features/faq/components/FAQManagement';
import DashboardLoading from '../loading';

export default function FAQPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <FAQManagement />
    </Suspense>
  );
}
