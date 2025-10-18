'use client';

import { Suspense } from 'react';
import { useAuthStore } from '@/features/auth/store';
import {
  DocumentsList,
  DocumentsListSkeleton,
} from '@/features/documents/components/DocumentsListWithUpload';
import { DocumentsTable } from '@/features/documents/components/DocumentsTable';

export default function DocumentsPage() {
  const { user } = useAuthStore();

  // Show table view for AGENT/ADMIN, card view for CLIENT
  const isClient = user?.role === 'CLIENT';

  return (
    <Suspense fallback={<DocumentsListSkeleton />}>
      {isClient ? <DocumentsList /> : <DocumentsTable />}
    </Suspense>
  );
}
