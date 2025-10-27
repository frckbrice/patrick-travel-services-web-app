'use client';

// Enhanced messages list component with full chat functionality

import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  Clock,
  Circle,
  X,
  FileIcon,
  Image as ImageIcon,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SimpleSkeleton, SkeletonText, SkeletonCard } from '@/components/ui/simple-skeleton';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import type { Message, Conversation } from '../api/types';
import { useSendMessage } from '../api';
import type { ChatRoom as UIChatRoom } from '../types';
import type { ChatRoom as FirebaseChatRoom, ChatMessage } from '@/lib/firebase/chat.service';
import {
  useRealtimeChatRooms,
  useRealtimeMessages,
  useMultipleUserPresence,
  useTypingStatus,
  useTypingIndicators,
} from '../hooks/useRealtimeChat';
import { useUserLookup } from '../hooks/useUserLookup';
import { uploadFiles, getAuthHeaders } from '@/lib/uploadthing/client';
import type { MessageAttachment } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { Download } from 'lucide-react';
import { EmailComposer } from './EmailComposer';

interface MessagesListProps {
  preselectedClientId?: string;
  preselectedClientName?: string;
  preselectedClientEmail?: string;
  caseReference?: string;
  initialMode?: 'email' | 'chat';
}

export function MessagesList({
  preselectedClientId,
  preselectedClientName,
  preselectedClientEmail,
  caseReference,
  initialMode,
}: MessagesListProps = {}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix hydration mismatch - only render time-dependent content on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle preselected client - open email composer or select chat
  useEffect(() => {
    if (preselectedClientId && initialMode === 'email') {
      // Open email composer with pre-filled recipient
      setEmailComposerOpen(true);
    } else if (preselectedClientId && initialMode !== 'email') {
      // Try to find and select the chat room for this client
      // This will be handled after conversations load
    }
  }, [preselectedClientId, initialMode]);

  // REAL-TIME: Get chat rooms (replaces polling)
  const { chatRooms: apiConversations, isLoading: isLoadingConversations } = useRealtimeChatRooms();

  // REAL-TIME: Get messages for selected room (replaces polling)
  const { messages: apiMessages, isLoading: isLoadingMessages } = useRealtimeMessages(selected);

  // REAL-TIME: Get typing status and control typing indicator
  const { startTyping, stopTyping } = useTypingStatus(selected);

  // Send message mutation
  const sendMessageMutation = useSendMessage();

  // User lookup for participant names (performance-optimized with caching)
  // Pass apiMessages so CLIENT users can extract participant info from message metadata
  const { getUserInfo, isLoading: isLoadingUsers } = useUserLookup(apiMessages);

  // Get participant IDs for presence tracking
  const participantIds = useMemo(() => {
    if (!apiConversations) return [];
    return apiConversations
      .flatMap((room) => Object.keys(room.participants || {}))
      .filter((id) => id !== user?.id);
  }, [apiConversations, user?.id]);

  // REAL-TIME: Track online status of all participants
  const { presences } = useMultipleUserPresence(participantIds);

  // REAL-TIME: Track typing indicators for selected chat
  const { typingUsers } = useTypingIndicators(selected);

  // Transform ChatRoom to Conversation format for UI
  const conversations = useMemo(() => {
    const conversationList: Conversation[] = [];

    // Add existing Firebase chat rooms
    if (apiConversations && apiConversations.length > 0) {
      const firebaseConvos = apiConversations
        .filter((room: FirebaseChatRoom): room is FirebaseChatRoom & { id: string } => !!room.id)
        .map((room) => {
          // Get the other participant (not current user)
          const otherParticipantId = Object.keys(room.participants || {}).find(
            (id) => id !== user?.id
          );
          const unreadCount = user?.id && room.unreadCount ? room.unreadCount[user.id] || 0 : 0;

          // Lookup user info for participant (performance-optimized)
          const participantInfo = getUserInfo(otherParticipantId);
          const participantName = participantInfo?.fullName || 'Unknown User';
          const participantRole = participantInfo?.role || 'User';

          return {
            id: room.id,
            participantId: otherParticipantId || '',
            participantName,
            participantRole,
            lastMessage: room.lastMessage || '',
            lastMessageTime: room.lastMessageAt
              ? new Date(room.lastMessageAt).toISOString()
              : new Date().toISOString(),
            unreadCount,
          } as Conversation;
        });

      conversationList.push(...firebaseConvos);
    }

    // If preselected client from URL and not in existing conversations, add virtual entry
    if (preselectedClientId && preselectedClientName) {
      const existsInList = conversationList.some(
        (conv) => conv.participantId === preselectedClientId
      );

      if (!existsInList) {
        // Create virtual conversation for preselected client
        conversationList.unshift({
          id: `virtual-${preselectedClientId}`, // Virtual ID, will be replaced when chat room is created
          participantId: preselectedClientId,
          participantName: preselectedClientName,
          participantRole: 'CLIENT',
          lastMessage: 'Ready to start conversation',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        } as Conversation);
      }
    }

    return conversationList;
  }, [apiConversations, user?.id, getUserInfo, preselectedClientId, preselectedClientName]);

  // Transform API messages to UI format and merge with optimistic messages
  const messages = useMemo(() => {
    if (!selected) return [];

    const transformedMessages: Message[] = [];

    if (apiMessages && apiMessages.length > 0) {
      const transformed = apiMessages
        .filter((msg: ChatMessage): msg is ChatMessage & { id: string } => !!msg.id)
        .map(
          (msg) =>
            ({
              id: msg.id,
              senderId: msg.senderId,
              senderName: msg.senderName,
              content: msg.content,
              sentAt: new Date(msg.sentAt).toISOString(),
              attachments: msg.attachments || [],
            }) as Message
        );
      transformedMessages.push(...transformed);
    }

    // Merge optimistic messages (only ones not yet in Firebase)
    const apiMessageIds = new Set(transformedMessages.map((m) => m.id));
    const pendingOptimistic = optimisticMessages.filter((m) => !apiMessageIds.has(m.id));
    transformedMessages.push(...pendingOptimistic);

    // Sort by time
    return transformedMessages.sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
  }, [selected, apiMessages, optimisticMessages]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.participantName.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select conversation based on preselected client or first available
  useEffect(() => {
    if (conversations.length === 0) return;

    // PRIORITY: If we have a preselected client from URL, always select that conversation
    if (preselectedClientId) {
      const targetConversation = conversations.find(
        (conv) => conv.participantId === preselectedClientId
      );

      if (targetConversation && targetConversation.id !== selected) {
        console.log('[Auto-select] Selecting preselected client conversation:', {
          conversationId: targetConversation.id,
          clientId: preselectedClientId,
          clientName: targetConversation.participantName,
          isNew: targetConversation.id.startsWith('virtual-'),
        });
        setSelected(targetConversation.id);
      }
    } else if (!selected) {
      // No preselection, select first conversation
      console.log('[Auto-select] No preselection - selecting first conversation');
      setSelected(conversations[0].id);
    }
  }, [conversations, preselectedClientId, selected]);

  const formatTime = (date: string) => {
    // Avoid hydration mismatch - don't render time on server
    if (!isMounted) return '';

    const d = new Date(date);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return t('messages.justNow') || 'Just now';
    if (diffHours < 24)
      return d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
    if (diffHours < 48) return t('messages.yesterday') || 'Yesterday';
    return d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  };

  const handleSend = async () => {
    if (!input.trim() || !selected || !user) return;

    // Stop typing indicator when sending
    stopTyping();

    // Find the selected conversation to get recipient info
    const selectedConv = conversations.find((c) => c.id === selected);
    if (!selectedConv) {
      toast.error('Unable to send message: conversation not found');
      return;
    }

    // Get recipient info for proper message sending
    const recipientInfo = getUserInfo(selectedConv.participantId);

    // Store the message content
    const messageContent = input.trim();

    // Clear input immediately for better UX
    setInput('');

    // OPTIMISTIC UPDATE: Add message to UI immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`.trim(),
      content: messageContent,
      sentAt: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Add to optimistic messages array
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Send through API mutation - error handling is done in the mutation
      await sendMessageMutation.mutateAsync({
        recipientId: selectedConv.participantId,
        recipientName: selectedConv.participantName,
        recipientEmail: recipientInfo?.email || '',
        content: messageContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Clear attachments after successful send
      setAttachments([]);

      // Success! Firebase real-time listener will pick it up and replace optimistic message
      // Clean up optimistic message after a delay (Firebase should have it by then)
      setTimeout(() => {
        setOptimisticMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      }, 2000);
    } catch (error) {
      // Remove optimistic message on error
      setOptimisticMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      // Error toast is shown by mutation
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count (max 3)
    if (attachments.length + files.length > 3) {
      toast.error('Maximum 3 attachments allowed per message');
      return;
    }

    setIsUploading(true);
    try {
      logger.debug('[Message Upload] Starting upload', { fileCount: files.length });

      // Get authentication headers
      const headers = await getAuthHeaders();

      // Use uploadFiles with authentication headers
      const uploadedFiles = await uploadFiles('messageAttachment', {
        files: Array.from(files),
        headers,
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Upload failed: No result returned');
      }

      // Convert to MessageAttachment format
      const newAttachments: MessageAttachment[] = uploadedFiles.map((file) => ({
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      toast.success(`${uploadedFiles.length} file(s) attached`);
    } catch (error) {
      logger.error('File upload error:', error);
      toast.error('Failed to upload file(s)');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const selectedConversation = conversations.find((c) => c.id === selected);

  // PROGRESSIVE UI: Show layout immediately, populate with data as it loads
  const isFirstLoad = (isLoadingConversations || isLoadingUsers) && conversations.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'CLIENT'
              ? 'Communicate with your immigration advisor'
              : 'Manage conversations with your clients'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEmailComposerOpen(true)} className="gap-2">
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      </div>

      {/* Email Composer */}
      <EmailComposer
        open={emailComposerOpen}
        onOpenChange={setEmailComposerOpen}
        recipientId={preselectedClientId || selectedConversation?.participantId}
        recipientName={preselectedClientName || selectedConversation?.participantName}
        recipientEmail={preselectedClientEmail}
        caseReference={caseReference}
      />

      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
        {/* Conversations */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                aria-label="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isFirstLoad}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {/* PROGRESSIVE LOADING: Show skeleton while loading first time */}
            {isFirstLoad ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <SimpleSkeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonText size="md" className="w-3/4" />
                      <SkeletonText size="sm" className="w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  role="option"
                  aria-selected={selected === conv.id}
                  aria-label={`Conversation with ${conv.participantName}`}
                  className={cn(
                    'w-full p-4 text-left hover:bg-muted/50 transition border-b',
                    selected === conv.id && 'bg-muted'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(conv.participantName)}</AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      {presences[conv.participantId]?.status === 'online' && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <h4 className="text-sm font-semibold truncate">{conv.participantName}</h4>
                          {presences[conv.participantId]?.status === 'online' && (
                            <span className="text-xs text-green-600">•</span>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{conv.participantRole}</p>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      {isMounted && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs" suppressHydrationWarning>
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {selected && selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(selectedConversation.participantName)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    {presences[selectedConversation.participantId]?.status === 'online' && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{selectedConversation.participantName}</h3>
                      {presences[selectedConversation.participantId]?.status === 'online' && (
                        <Badge variant="outline" className="text-xs">
                          Online
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participantRole}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-2">
                      <SimpleSkeleton className="h-12 w-12 rounded-full" />
                      <SkeletonText size="md" className="w-32" />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3 max-w-md">
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-1">
                          No conversation yet with {selectedConversation?.participantName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Start a new conversation by typing your message below
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isOwn = user ? msg.senderId === user.id : false;
                      const hasAttachments = msg.attachments && msg.attachments.length > 0;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex gap-2 items-start',
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(msg.senderName)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg p-3 space-y-2',
                              isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}
                          >
                            {msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            )}

                            {/* Attachments */}
                            {hasAttachments && (
                              <div className="space-y-2">
                                {msg.attachments!.map((attachment, idx) => (
                                  <a
                                    key={idx}
                                    href={attachment.url}
                                    download={attachment.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded border transition-colors',
                                      isOwn
                                        ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20'
                                        : 'bg-background hover:bg-accent border-border'
                                    )}
                                  >
                                    {attachment.type.startsWith('image/') ? (
                                      <div className="flex flex-col gap-2 w-full">
                                        <img
                                          src={attachment.url}
                                          alt={attachment.name}
                                          className="w-full max-w-md h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            window.open(attachment.url, '_blank');
                                          }}
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                          <span
                                            className={cn(
                                              'text-xs truncate',
                                              isOwn
                                                ? 'text-primary-foreground/80'
                                                : 'text-muted-foreground'
                                            )}
                                          >
                                            {attachment.name}
                                          </span>
                                          <span
                                            className={cn(
                                              'text-xs flex items-center gap-1',
                                              isOwn
                                                ? 'text-primary-foreground/80'
                                                : 'text-muted-foreground'
                                            )}
                                          >
                                            <Download className="h-3 w-3" />
                                            Download
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <FileIcon
                                          className={cn(
                                            'h-5 w-5 flex-shrink-0',
                                            isOwn
                                              ? 'text-primary-foreground'
                                              : 'text-muted-foreground'
                                          )}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p
                                            className={cn(
                                              'text-sm font-medium truncate',
                                              isOwn ? 'text-primary-foreground' : 'text-foreground'
                                            )}
                                          >
                                            {attachment.name}
                                          </p>
                                          <p
                                            className={cn(
                                              'text-xs mt-0.5',
                                              isOwn
                                                ? 'text-primary-foreground/70'
                                                : 'text-muted-foreground'
                                            )}
                                          >
                                            {attachment.size > 1024 * 1024
                                              ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
                                              : `${(attachment.size / 1024).toFixed(0)} KB`}
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                          <Download
                                            className={cn(
                                              'h-5 w-5 flex-shrink-0',
                                              isOwn ? 'text-primary-foreground' : 'text-primary'
                                            )}
                                          />
                                          <span
                                            className={cn(
                                              'text-xs font-medium',
                                              isOwn ? 'text-primary-foreground' : 'text-primary'
                                            )}
                                          >
                                            Download
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}

                            {isMounted && (
                              <p
                                className={cn(
                                  'text-xs',
                                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}
                                suppressHydrationWarning
                              >
                                {formatTime(msg.sentAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex gap-2 items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(typingUsers[0].userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex gap-1">
                            <Circle
                              className="h-2 w-2 fill-current animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <Circle
                              className="h-2 w-2 fill-current animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            />
                            <Circle
                              className="h-2 w-2 fill-current animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <div className="border-t p-4">
                {/* Attachment Preview */}
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
                      >
                        {attachment.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-[150px]">{attachment.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAttachmentClick}
                    disabled={isUploading || attachments.length >= 3}
                    title={isUploading ? 'Uploading...' : 'Attach file'}
                  >
                    <Paperclip className={cn('h-4 w-4', isUploading && 'animate-pulse')} />
                  </Button>

                  <Input
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Trigger typing indicator when user types
                      if (e.target.value.trim()) {
                        startTyping();
                      } else {
                        stopTyping();
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    onBlur={stopTyping}
                    disabled={sendMessageMutation.isPending || isUploading}
                  />

                  <Button
                    onClick={handleSend}
                    disabled={
                      (!input.trim() && attachments.length === 0) ||
                      sendMessageMutation.isPending ||
                      isUploading
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* PROGRESSIVE UI: Show skeleton for chat panel on first load */
            <CardContent className="flex-1 flex items-center justify-center">
              {isFirstLoad ? (
                <div className="w-full max-w-md space-y-4">
                  <div className="flex gap-3 items-center pb-4 border-b">
                    <SimpleSkeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonText size="md" className="w-32" />
                      <SkeletonText size="sm" className="w-24" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <SkeletonText size="md" className="w-3/4" />
                    <SkeletonText size="md" className="w-2/3" />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold">Select a Conversation</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a conversation to start messaging
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * PERFORMANCE OPTIMIZED: Reduced from ~50 DOM elements to ~15
 * - Memoized → Better TBT
 * - Reduced conversations from 3 to 2 → Better Speed Index
 * - Simplified structure → Better FCP & CLS
 */
export const MessagesListSkeleton = memo(function MessagesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText size="xl" className="w-48" />
        <SkeletonText size="sm" className="w-80" />
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Conversations list - Reduced from 3 to 2 items */}
        <SimpleSkeleton className="lg:col-span-1 h-96 rounded-lg" />
        {/* Chat area */}
        <SimpleSkeleton className="lg:col-span-2 h-96 rounded-lg" />
      </div>
    </div>
  );
});
