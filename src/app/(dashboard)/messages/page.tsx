import { Suspense } from 'react';
import { MessagesList } from '@/features/messages/components/MessagesList';
import DashboardLoading from '../loading';

export default function MessagesPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <MessagesList />
        </Suspense>
    );
}

