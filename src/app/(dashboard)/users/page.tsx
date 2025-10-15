import { Suspense } from 'react';
import { UsersList } from '@/features/users/components/UsersList';
import DashboardLoading from '../loading';

export default function UsersPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <UsersList />
        </Suspense>
    );
}
