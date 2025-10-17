
export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
}

export interface Conversation {
    id: string;
    participantName: string;
    participantRole: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}