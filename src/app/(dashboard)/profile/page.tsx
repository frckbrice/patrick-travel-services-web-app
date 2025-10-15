import { Suspense } from 'react';
import { ProfileView } from '@/features/profile/components/ProfileView';
import DashboardLoading from '../loading';

export default function ProfilePage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <ProfileView />
        </Suspense>
    );
}

