'use client';

// Enhanced messages list component with full chat functionality

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store';
import { MessageSquare, Send, Search, Paperclip, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
}

interface Conversation {
    id: string;
    participantName: string;
    participantRole: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

// Mock data
const mockConversations: Conversation[] = [
    {
        id: '1',
        participantName: 'John Doe',
        participantRole: 'Immigration Advisor',
        lastMessage: 'I reviewed your documents. Everything looks good!',
        lastMessageTime: '2025-01-15T10:30:00Z',
        unreadCount: 2,
    },
    {
        id: '2',
        participantName: 'Jane Smith',
        participantRole: 'Senior Agent',
        lastMessage: 'Please upload your updated bank statement',
        lastMessageTime: '2025-01-14T15:20:00Z',
        unreadCount: 0,
    },
];

const mockMessages: Record<string, Message[]> = {
    '1': [
        {
            id: '1',
            senderId: 'agent-1',
            senderName: 'John Doe',
            content: 'Hello! I am your assigned immigration advisor. How can I help you today?',
            sentAt: '2025-01-15T09:00:00Z',
        },
        {
            id: '2',
            senderId: 'client-1',
            senderName: 'You',
            content: 'Hi! I have a question about my student visa application.',
            sentAt: '2025-01-15T09:15:00Z',
        },
        {
            id: '3',
            senderId: 'agent-1',
            senderName: 'John Doe',
            content: 'Of course! I would be happy to help. What would you like to know?',
            sentAt: '2025-01-15T09:20:00Z',
        },
        {
            id: '4',
            senderId: 'client-1',
            senderName: 'You',
            content: 'When should I expect to hear back about my application status?',
            sentAt: '2025-01-15T09:25:00Z',
        },
        {
            id: '5',
            senderId: 'agent-1',
            senderName: 'John Doe',
            content: 'I reviewed your documents. Everything looks good! Processing typically takes 4-6 weeks. I will keep you updated.',
            sentAt: '2025-01-15T10:30:00Z',
        },
    ],
    '2': [
        {
            id: '1',
            senderId: 'agent-2',
            senderName: 'Jane Smith',
            content: 'Hi, I noticed your bank statement needs to be updated.',
            sentAt: '2025-01-14T15:20:00Z',
        },
    ],
};

export function MessagesList() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [selected, setSelected] = useState<string | null>('1');
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected]);

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

        if (diff < 1) return 'Just now';
        if (diff < 24) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (diff < 48) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleSend = () => {
        if (!input.trim()) return;
        console.log('Send:', input);
        setInput('');
    };

    const messages = selected ? mockMessages[selected] || [] : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground mt-2">
                    Communicate with your immigration advisor
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
                {/* Conversations */}
                <Card className="lg:col-span-1 overflow-hidden flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="text-base">Conversations</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." className="pl-8" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {mockConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelected(conv.id)}
                                className={cn(
                                    'w-full p-4 text-left hover:bg-muted/50 transition border-b',
                                    selected === conv.id && 'bg-muted'
                                )}
                            >
                                <div className="flex gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>
                                            {conv.participantName.split(' ').map(n => n[0]).join('')}
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
                        ))}
                    </CardContent>
                </Card>

                {/* Chat */}
                <Card className="lg:col-span-2 overflow-hidden flex flex-col">
                    {selected ? (
                        <>
                            <CardHeader className="border-b">
                                <div className="flex gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {mockConversations.find(c => c.id === selected)?.participantName.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">
                                            {mockConversations.find(c => c.id === selected)?.participantName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {mockConversations.find(c => c.id === selected)?.participantRole}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => {
                                    const isOwn = msg.senderId.startsWith('client');
                                    return (
                                        <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {msg.senderName.split(' ').map(n => n[0]).join('')}
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
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <Button onClick={handleSend}>
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

