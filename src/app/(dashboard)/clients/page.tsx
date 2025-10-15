import { Suspense } from 'react';
import { ClientsList } from '@/features/clients/components/ClientsList';
import DashboardLoading from '../loading';

export default function ClientsPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <ClientsList />
        </Suspense>
    );
}
