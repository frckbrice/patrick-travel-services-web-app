import { Suspense } from 'react';
import {
  UsersListEnhanced,
  UsersListSkeleton,
} from '@/features/users/components/UsersListEnhanced';

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersListSkeleton />}>
      <UsersListEnhanced />
    </Suspense>
  );
}
