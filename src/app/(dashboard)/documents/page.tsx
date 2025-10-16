import { Suspense } from 'react';
import { DocumentsList, DocumentsListSkeleton } from '@/features/documents/components/DocumentsListWithUpload';

export default function DocumentsPage() {
    return (
        <Suspense fallback={<DocumentsListSkeleton />}>
            <DocumentsList />
        </Suspense>
    );
}
