import type { MessageAttachment } from '@/lib/types';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
  attachments?: MessageAttachment[];
  status?: 'sending' | 'sent' | 'delivered' | 'failed'; // For optimistic messages
  firebaseId?: string; // Firebase message ID
  archivedToDb?: boolean; // Whether archived to PostgreSQL
  errorMessage?: string; // Error if failed
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail?: string; // Email for message sending
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  caseId?: string; // Chat room ID is typically the caseId
}
