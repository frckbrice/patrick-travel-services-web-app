import { Suspense } from 'react';
import { MessagesList, MessagesListSkeleton } from '@/features/messages/components/MessagesListEnhanced';

export default function MessagesPage() {
    return (
        <Suspense fallback={<MessagesListSkeleton />}>
            <MessagesList />
        </Suspense>
    );
}
