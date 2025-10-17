'use client';

// Enhanced messages list component with full chat functionality

import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store';
import { MessageSquare, Send, Search, Paperclip, Clock, AlertCircle, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import type { Message, Conversation } from '../api/types';
import { useSendMessage } from '../api';
import type { ChatRoom, Message as ApiMessage } from '../types';
import {
    useRealtimeChatRooms,
    useRealtimeMessages,
    useMultipleUserPresence,
    useTypingStatus,
    useTypingIndicators
} from '../hooks/useRealtimeChat';

export function MessagesList() {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const [selected, setSelected] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    // REAL-TIME: Get chat rooms (replaces polling)
    const { chatRooms: apiConversations, isLoading: isLoadingConversations } = useRealtimeChatRooms();

    // REAL-TIME: Get messages for selected room (replaces polling)
    const { messages: apiMessages, isLoading: isLoadingMessages } = useRealtimeMessages(selected);

    // REAL-TIME: Get typing status and control typing indicator
    const { startTyping, stopTyping } = useTypingStatus(selected);

    // Send message mutation
    const sendMessageMutation = useSendMessage();

    // Get participant IDs for presence tracking
    const participantIds = useMemo(() => {
        if (!apiConversations) return [];
        return apiConversations
            .flatMap(room => room.participants || [])
            .filter(id => id !== user?.id);
    }, [apiConversations, user?.id]);

    // REAL-TIME: Track online status of all participants
    const { presences } = useMultipleUserPresence(participantIds);

    // REAL-TIME: Track typing indicators for selected chat
    const { typingUsers } = useTypingIndicators(selected);

    // Transform ChatRoom to Conversation format for UI
    const conversations = useMemo(() => {
        if (!apiConversations || apiConversations.length === 0) {
            // Return empty array - no mock data fallback in production
            return [];
        }

        return apiConversations.map((room: ChatRoom) => {
            // Get the other participant (not current user)
            const otherParticipantId = room.participants.find(id => id !== user?.id);
            const unreadCount = user?.id && room.unreadCount ? (room.unreadCount[user.id] || 0) : 0;

            return {
                id: room.id || '',
                participantName: otherParticipantId || 'Unknown',
                participantRole: 'User', // This could be enhanced with actual role data
                lastMessage: room.lastMessage || '',
                lastMessageTime: room.lastMessageAt ? new Date(room.lastMessageAt).toISOString() : new Date().toISOString(),
                unreadCount,
            } as Conversation;
        });
    }, [apiConversations, user?.id]);

    // Transform API messages to UI format
    const messages = useMemo(() => {
        if (!selected) return [];

        if (apiMessages && apiMessages.length > 0) {
            return apiMessages.map((msg: ApiMessage) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content: msg.content,
                sentAt: new Date(msg.sentAt).toISOString(),
            } as Message));
        }

        // Return empty array - no mock data fallback in production
        return [];
    }, [selected, apiMessages]);

    // Filter conversations by search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;

        const query = searchQuery.toLowerCase();
        return conversations.filter(conv =>
            conv.participantName.toLowerCase().includes(query) ||
            conv.lastMessage.toLowerCase().includes(query)
        );
    }, [conversations, searchQuery]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-select first conversation if available
    useEffect(() => {
        if (!selected && conversations.length > 0) {
            setSelected(conversations[0].id);
        }
    }, [conversations, selected]);

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

        if (diff < 1) return t('messages.justNow') || 'Just now';
        if (diff < 24) return d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
        if (diff < 48) return t('messages.yesterday') || 'Yesterday';
        return d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
    };

    const handleSend = () => {
        if (!input.trim() || !selected) return;
        
        // Stop typing indicator when sending
        stopTyping();

        // Find the selected conversation to get recipient info
        const selectedConv = conversations.find(c => c.id === selected);
        if (!selectedConv) {
            toast.error('Unable to send message: conversation not found');
            return;
        }

        // Send through API mutation - error handling is done in the mutation
        sendMessageMutation.mutate({
            recipientId: selectedConv.participantName, // This should be the actual user ID
            recipientName: selectedConv.participantName,
            recipientEmail: '', // This could be enhanced with actual email
            content: input.trim(),
        });

        setInput('');
    };

    const selectedConversation = conversations.find(c => c.id === selected);

    // Show loading skeleton while fetching conversations
    if (isLoadingConversations) {
        return <MessagesListSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground mt-2">
                    Communicate with your immigration advisor
                </p>
                {conversationsError && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Failed to load conversations. Please try again later.</span>
                    </div>
                )}
            </div>

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
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
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
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>
                                                {getInitials(conv.participantName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="text-sm font-semibold truncate">
                                                    {conv.participantName}
                                                </h4>
                                                {conv.unreadCount > 0 && (
                                                    <Badge variant="default" className="ml-2">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {conv.participantRole}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {conv.lastMessage}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-xs">{formatTime(conv.lastMessageTime)}</span>
                                            </div>
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
                                    <Avatar>
                                        <AvatarFallback>
                                            {getInitials(selectedConversation.participantName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">
                                            {selectedConversation.participantName}
                                        </h3>
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
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
                                    </div>
                                ) : (
                                    <>
                                                {messages.map((msg) => {
                                                    const isOwn = user ? msg.senderId === user.id : false;
                                                    return (
                                                        <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs">
                                                                    {getInitials(msg.senderName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className={cn('max-w-[70%] rounded-lg p-3', isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                <p className="text-sm">{msg.content}</p>
                                                                <p className={cn('text-xs mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                                                    {formatTime(msg.sentAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={endRef} />
                                    </>
                                )}
                            </CardContent>
                            <div className="border-t p-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        placeholder="Type a message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!input.trim() || sendMessageMutation.isPending}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CardContent className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold">Select a Conversation</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Choose a conversation to start messaging
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}

export function MessagesListSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
                <Card className="lg:col-span-1">
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 p-4 border-b">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardContent className="p-12 flex items-center justify-center">
                        <Skeleton className="h-32 w-64" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

