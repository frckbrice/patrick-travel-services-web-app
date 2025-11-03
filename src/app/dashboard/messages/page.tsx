import { Suspense } from 'react';
import { MessagesPageWithTabs } from '@/features/messages/components';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';

interface MessagesPageProps {
  searchParams: Promise<{
    clientId?: string;
    clientName?: string;
    clientEmail?: string;
    caseRef?: string;
    mode?: 'email' | 'chat';
    tab?: 'active' | 'received' | 'history';
    messageId?: string;
  }>;
}

function MessagesPageSkeleton() {
  return (
    <div className="space-y-6">
      <SimpleSkeleton className="h-12 w-full max-w-md" />
      <SimpleSkeleton className="h-[600px] w-full" />
    </div>
  );
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<MessagesPageSkeleton />}>
      <MessagesPageWithTabs
        preselectedClientId={params.clientId}
        preselectedClientName={params.clientName}
        preselectedClientEmail={params.clientEmail}
        caseReference={params.caseRef}
        initialMode={params.mode}
        initialTab={params.tab}
        preselectedMessageId={params.messageId}
      />
    </Suspense>
  );
}
