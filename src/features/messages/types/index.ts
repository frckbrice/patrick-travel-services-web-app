// Types for Messages feature
import { MessageAttachment } from '@/lib/types';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  caseId?: string;
  subject?: string;
  content: string;
  isRead: boolean;
  readAt?: number;
  sentAt: number;
  attachments?: MessageAttachment[];
  status?: MessageStatus; // For optimistic messages
  firebaseId?: string; // Firebase message ID
  archivedToDb?: boolean; // Whether archived to PostgreSQL
  errorMessage?: string; // Error if failed
}

export interface ChatRoom {
  id: string;
  participants: Record<string, boolean>; // Map of user IDs to true (userId -> true)
  caseId?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface SendMessageInput {
  senderId?: string; // Optional - will be auto-filled from auth if not provided
  senderName?: string; // Optional - will be auto-filled from auth if not provided
  senderEmail?: string; // Optional - will be auto-filled from auth if not provided
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  content: string;
  caseId?: string;
  subject?: string;
  attachments?: MessageAttachment[];
}

export interface ArchiveMessageInput {
  firebaseId: string;
  senderId: string;
  recipientId: string;
  content: string;
  caseId?: string;
  attachments?: MessageAttachment[];
  sentAt: number;
}

export interface SendEmailInput {
  recipientId?: string; // Optional for clients (auto-determined from case)
  caseId?: string; // Required for clients, optional for agents
  subject: string;
  content: string;
  attachments?: MessageAttachment[];
}
