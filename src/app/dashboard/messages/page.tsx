import { Suspense } from 'react';
import { MessagesList, MessagesListSkeleton } from '@/features/messages/components';

interface MessagesPageProps {
  searchParams: Promise<{
    clientId?: string;
    clientName?: string;
    clientEmail?: string;
    caseRef?: string;
    mode?: 'email' | 'chat';
  }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  
  return (
    <Suspense fallback={<MessagesListSkeleton />}>
      <MessagesList 
        preselectedClientId={params.clientId}
        preselectedClientName={params.clientName}
        preselectedClientEmail={params.clientEmail}
        caseReference={params.caseRef}
        initialMode={params.mode}
      />
    </Suspense>
  );
}
