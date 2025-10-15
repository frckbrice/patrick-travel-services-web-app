import { Suspense } from 'react';
import { SettingsView } from '@/features/settings/components/SettingsView';
import DashboardLoading from '../loading';

export default function SettingsPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <SettingsView />
        </Suspense>
    );
}
