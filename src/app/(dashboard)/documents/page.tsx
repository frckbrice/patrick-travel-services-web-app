import { Suspense } from 'react';
import { DocumentsList } from '@/features/documents/components/DocumentsList';
import DashboardLoading from '../loading';

export default function DocumentsPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DocumentsList />
        </Suspense>
    );
}

