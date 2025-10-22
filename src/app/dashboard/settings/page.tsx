import { Suspense } from 'react';
import {
  SettingsView,
  SettingsViewSkeleton,
} from '@/features/settings/components/SettingsViewEnhanced';

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsViewSkeleton />}>
      <SettingsView />
    </Suspense>
  );
}
