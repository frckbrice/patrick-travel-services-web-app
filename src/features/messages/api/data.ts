// Mock data for messages feature

import type { Conversation, Message } from './types';

export const mockConversations: Conversation[] = [
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

export const mockMessages: Record<string, Message[]> = {
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

