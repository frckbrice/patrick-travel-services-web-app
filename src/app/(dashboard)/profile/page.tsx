import { Suspense } from 'react';
import { ProfileView, ProfileViewSkeleton } from '@/features/profile/components/ProfileViewEnhanced';

export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfileViewSkeleton />}>
            <ProfileView />
        </Suspense>
    );
}
