'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquare,
  Mail,
  Search,
  Calendar,
  User,
  Briefcase,
  ChevronRight,
  MessageCircle,
  Send,
  Filter,
} from 'lucide-react';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageType: 'EMAIL' | 'CHAT';
  messageCount: number;
  unreadCount: number;
  conversationType: 'EMAIL' | 'CHAT' | 'MIXED';
  caseReference?: string;
  caseId?: string;
}

interface ConversationHistoryResponse {
  conversations: Conversation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function ConversationHistoryTable() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'EMAIL' | 'CHAT'>('all');

  // Fetch conversation history
  const { data, isLoading, error } = useQuery<ConversationHistoryResponse>({
    queryKey: ['conversation-history', typeFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '100');

      const response = await apiClient.get(`/api/conversations/history?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
  });

  const conversations = data?.conversations || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalConversations = conversations.length;
    const emailConversations = conversations.filter(
      (c) => c.conversationType === 'EMAIL' || c.conversationType === 'MIXED'
    ).length;
    const chatConversations = conversations.filter(
      (c) => c.conversationType === 'CHAT' || c.conversationType === 'MIXED'
    ).length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
    const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return {
      totalConversations,
      emailConversations,
      chatConversations,
      totalMessages,
      unreadMessages,
    };
  }, [conversations]);

  const handleStartChat = (conversation: Conversation) => {
    // Navigate to messages page with client info and chat mode to switch to Active Chats tab
    router.push(
      `/dashboard/messages?mode=chat&clientId=${conversation.participantId}&clientName=${encodeURIComponent(conversation.participantName)}&clientEmail=${encodeURIComponent(conversation.participantEmail)}`
    );
  };

  const handleSendEmail = (conversation: Conversation) => {
    router.push(
      `/dashboard/messages?mode=email&clientId=${conversation.participantId}&clientName=${encodeURIComponent(conversation.participantName)}&clientEmail=${encodeURIComponent(conversation.participantEmail)}${conversation.caseReference ? `&caseRef=${encodeURIComponent(conversation.caseReference)}` : ''}`
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getConversationTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'CHAT':
        return <MessageSquare className="h-4 w-4" />;
      case 'MIXED':
        return (
          <div className="flex gap-0.5">
            <Mail className="h-3 w-3" />
            <MessageSquare className="h-3 w-3" />
          </div>
        );
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getConversationTypeBadge = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Badge>
        );
      case 'CHAT':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </Badge>
        );
      case 'MIXED':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <MessageCircle className="h-3 w-3 mr-1" />
            Mixed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <SimpleSkeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <SimpleSkeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">Failed to load conversation history</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">{stats.totalConversations}</span>
              <span className="text-xs text-muted-foreground mt-1">Total Conversations</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{stats.emailConversations}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Email Threads</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{stats.chatConversations}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Chat Sessions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">{stats.totalMessages}</span>
              <span className="text-xs text-muted-foreground mt-1">Total Messages</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-orange-600">{stats.unreadMessages}</span>
              <span className="text-xs text-muted-foreground mt-1">Unread Messages</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="EMAIL">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Only
                  </div>
                </SelectItem>
                <SelectItem value="CHAT">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardContent className="p-0">
          {conversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No conversations found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Start messaging with clients to see conversations here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead className="text-center">Messages</TableHead>
                    <TableHead className="text-center">Unread</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow key={conversation.id} className="hover:bg-muted/50">
                      {/* Participant */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(conversation.participantName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {conversation.participantName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.participantEmail}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {conversation.participantRole}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        {getConversationTypeBadge(conversation.conversationType)}
                      </TableCell>

                      {/* Last Message */}
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">{conversation.lastMessage}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {conversation.lastMessageType === 'EMAIL' ? (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {conversation.lastMessageType}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Case */}
                      <TableCell>
                        {conversation.caseReference ? (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {conversation.caseReference}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Message Count */}
                      <TableCell className="text-center">
                        <Badge variant="secondary">{conversation.messageCount}</Badge>
                      </TableCell>

                      {/* Unread Count */}
                      <TableCell className="text-center">
                        {conversation.unreadCount > 0 ? (
                          <Badge className="bg-orange-500 hover:bg-orange-600">
                            {conversation.unreadCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Last Activity */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(conversation.lastMessageTime)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartChat(conversation)}
                            className="gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span className="hidden sm:inline">Chat</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(conversation)}
                            className="gap-1"
                          >
                            <Send className="h-3 w-3" />
                            <span className="hidden sm:inline">Email</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {data?.pagination && data.pagination.total > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {conversations.length} of {data.pagination.total} conversations
        </div>
      )}
    </div>
  );
}

export function ConversationHistoryTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <SimpleSkeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SimpleSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
