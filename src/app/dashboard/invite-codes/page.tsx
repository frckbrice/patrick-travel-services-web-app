import { Suspense } from 'react';
import {
  InviteCodeManagerEnhanced,
  InviteCodeManagerSkeleton,
} from '@/features/admin/components/InviteCodeManagerEnhanced';

export default function InviteCodesPage() {
  return (
    <Suspense fallback={<InviteCodeManagerSkeleton />}>
      <InviteCodeManagerEnhanced />
    </Suspense>
  );
}
