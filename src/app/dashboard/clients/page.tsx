import { Suspense } from 'react';
import { ClientsList, ClientsListSkeleton } from '@/features/clients/components/ClientsList';

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientsListSkeleton />}>
      <ClientsList />
    </Suspense>
  );
}
