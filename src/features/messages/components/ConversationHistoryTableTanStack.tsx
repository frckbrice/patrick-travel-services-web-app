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
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { cn, getInitials } from '@/lib/utils';
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

export function ConversationHistoryTableTanStack() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'EMAIL' | 'CHAT'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch conversation history
  const { data, isLoading, error } = useQuery<ConversationHistoryResponse>({
    queryKey: ['conversation-history', typeFilter, searchQuery, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', pageSize.toString());
      params.append('offset', ((currentPage - 1) * pageSize).toString());

      const response = await apiClient.get(`/api/conversations/history?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
  });

  const conversations = data?.conversations || [];
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / pageSize) : 0;

  const handleStartChat = (conversation: Conversation) => {
    router.push(
      `/dashboard/messages?clientId=${conversation.participantId}&clientName=${encodeURIComponent(conversation.participantName)}&clientEmail=${encodeURIComponent(conversation.participantEmail)}`
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <SimpleSkeleton className="h-6 w-6 rounded" />
              <div className="space-y-1">
                <SimpleSkeleton className="h-4 w-8" />
                <SimpleSkeleton className="h-3 w-12" />
              </div>
            </div>
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('messages.conversationHistory.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="overflow-x-auto">
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('messages.conversationHistory.showing', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, data?.pagination.total || 0),
              total: data?.pagination.total || 0,
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('messages.conversationHistory.previous')}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {t('messages.conversationHistory.next')}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConversationHistoryTableTanStackSkeleton() {
  return (
    <div className="space-y-6">
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
