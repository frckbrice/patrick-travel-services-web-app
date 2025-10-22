import { Suspense } from 'react';
import { UsersListEnhanced } from '@/features/users/components/UsersListEnhanced';
import DashboardLoading from '../loading';

export default function UsersPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <UsersListEnhanced />
    </Suspense>
  );
}
