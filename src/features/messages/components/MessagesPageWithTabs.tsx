'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, History, Mail } from 'lucide-react';
import { MessagesList } from './MessagesListEnhanced';
import { ConversationHistoryTable } from './ConversationHistoryTable';
import { Badge } from '@/components/ui/badge';

interface MessagesPageWithTabsProps {
  preselectedClientId?: string;
  preselectedClientName?: string;
  preselectedClientEmail?: string;
  caseReference?: string;
  initialMode?: 'email' | 'chat';
}

export function MessagesPageWithTabs({
  preselectedClientId,
  preselectedClientName,
  preselectedClientEmail,
  caseReference,
  initialMode,
}: MessagesPageWithTabsProps = {}) {
  const [activeTab, setActiveTab] = useState<string>('active');

  // If coming from case details with a specific client, show active tab
  useEffect(() => {
    if (preselectedClientId || initialMode === 'chat') {
      setActiveTab('active');
    } else if (initialMode === 'email') {
      setActiveTab('active'); // Stay on active tab for email mode too
    }
  }, [preselectedClientId, initialMode]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Active Chats
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Conversation History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-0">
          <MessagesList
            preselectedClientId={preselectedClientId}
            preselectedClientName={preselectedClientName}
            preselectedClientEmail={preselectedClientEmail}
            caseReference={caseReference}
            initialMode={initialMode}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-0">
          <ConversationHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
