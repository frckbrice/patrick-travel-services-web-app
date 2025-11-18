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
  Clock,
} from 'lucide-react';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

    if (diffHours < 1) return t('messages.justNow');
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return t('messages.yesterday');
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
            {t('messages.conversationHistory.conversationType.email')}
          </Badge>
        );
      case 'CHAT':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            {t('messages.conversationHistory.conversationType.chat')}
          </Badge>
        );
      case 'MIXED':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <MessageCircle className="h-3 w-3 mr-1" />
            {t('messages.conversationHistory.conversationType.mixed')}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <SimpleSkeleton className="h-16 w-full" />
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
          <p className="text-red-600">{t('messages.conversationHistory.failedToLoad')}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('messages.conversationHistory.pleaseTryAgain')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('messages.conversationHistory.totalConversations')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold">{stats.totalConversations}</span>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('messages.conversationHistory.emailThreads')}
            </span>
            <Mail className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold">{stats.emailConversations}</span>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('messages.conversationHistory.chatSessions')}
            </span>
            <MessageSquare className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-green-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold">{stats.chatConversations}</span>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('messages.conversationHistory.totalMessages')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold">{stats.totalMessages}</span>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('messages.conversationHistory.unreadMessages')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-orange-600">
              {stats.unreadMessages}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {t('messages.conversationHistory.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('messages.conversationHistory.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('messages.conversationHistory.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('messages.conversationHistory.allTypes')}</SelectItem>
                <SelectItem value="EMAIL">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('messages.conversationHistory.emailOnly')}
                  </div>
                </SelectItem>
                <SelectItem value="CHAT">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t('messages.conversationHistory.chatOnly')}
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
              <h3 className="text-lg font-semibold">
                {t('messages.conversationHistory.noConversationsFound')}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery
                  ? t('messages.conversationHistory.adjustSearchFilters')
                  : t('messages.conversationHistory.startMessagingClients')}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-3 sm:p-4">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="hover:shadow-md transition-shadow border shadow-sm cursor-pointer"
                    onClick={() => {
                      // Navigate to messages page with this conversation
                      window.location.href = `/dashboard/messages?client=${conversation.participantId}`;
                    }}
                  >
                    <CardContent className="p-3 sm:p-4 space-y-2.5">
                      {/* Header: Participant Info */}
                      <div className="flex items-start gap-2.5">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials(conversation.participantName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold truncate">
                              {conversation.participantName}
                            </h4>
                            {getConversationTypeBadge(conversation.conversationType)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {conversation.participantEmail}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {conversation.participantRole}
                          </Badge>
                        </div>
                      </div>

                      {/* Last Message */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          {conversation.lastMessageType === 'EMAIL' ? (
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats and Case */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Badge variant="secondary" className="text-xs">
                              {conversation.messageCount}
                            </Badge>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Badge variant="default" className="text-xs">
                                {conversation.unreadCount}{' '}
                                {t('messages.conversationHistory.unread')}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {conversation.caseReference && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium truncate max-w-[100px]">
                              {conversation.caseReference}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Last Activity */}
                      <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {format(new Date(conversation.lastMessageTime), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('messages.conversationHistory.participant')}</TableHead>
                      <TableHead>{t('messages.conversationHistory.type')}</TableHead>
                      <TableHead>{t('messages.conversationHistory.lastMessage')}</TableHead>
                      <TableHead>{t('messages.conversationHistory.case')}</TableHead>
                      <TableHead className="text-center">
                        {t('messages.conversationHistory.messages')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('messages.conversationHistory.unread')}
                      </TableHead>
                      <TableHead>{t('messages.conversationHistory.lastActivity')}</TableHead>
                      <TableHead className="text-right">
                        {t('messages.conversationHistory.actions')}
                      </TableHead>
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
                              <span className="hidden sm:inline">
                                {t('messages.conversationHistory.chat')}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(conversation)}
                              className="gap-1"
                            >
                              <Send className="h-3 w-3" />
                              <span className="hidden sm:inline">
                                {t('messages.conversationHistory.email')}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {data?.pagination && data.pagination.total > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {t('messages.conversationHistory.showingCount', {
            count: conversations.length,
            total: data.pagination.total,
          })}
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
