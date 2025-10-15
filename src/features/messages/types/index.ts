// Types for Messages feature

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
}

export interface MessageAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    caseId?: string;
    lastMessage?: string;
    lastMessageAt?: number;
    unreadCount?: Record<string, number>;
    createdAt: number;
    updatedAt: number;
}

export interface SendMessageInput {
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    content: string;
    caseId?: string;
    subject?: string;
    attachments?: MessageAttachment[];
}

