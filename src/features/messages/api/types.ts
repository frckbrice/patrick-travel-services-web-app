import type { MessageAttachment } from '@/lib/types';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
