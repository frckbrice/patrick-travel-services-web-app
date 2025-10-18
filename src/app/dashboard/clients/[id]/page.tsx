import { Suspense } from 'react';
import {
  ClientDetailView,
  ClientDetailSkeleton,
} from '@/features/clients/components/ClientDetailView';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ClientDetailSkeleton />}>
      <ClientDetailView clientId={id} />
    </Suspense>
  );
}
