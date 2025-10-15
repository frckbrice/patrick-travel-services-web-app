// Firebase Realtime Database service for chat/messaging

import {
    ref,
    push,
    set,
    get,
    update,
    query,
    orderByChild,
    equalTo,
    onValue,
    off,
    DataSnapshot,
} from 'firebase/database';
import { database } from './firebase-client';

export interface ChatMessage {
    id?: string;
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
    attachments?: Array<{
        id: string;
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
    }>;
}

export interface ChatRoom {
    id?: string;
    participants: string[]; // Array of user IDs
    caseId?: string;
    lastMessage?: string;
    lastMessageAt?: number;
    unreadCount?: Record<string, number>; // userId -> count
    createdAt: number;
    updatedAt: number;
}

// Get messages for a case
export async function getCaseMessages(caseId: string): Promise<ChatMessage[]> {
    const messagesRef = ref(database, 'messages');
    const caseMessagesQuery = query(messagesRef, orderByChild('caseId'), equalTo(caseId));

    const snapshot = await get(caseMessagesQuery);

    if (!snapshot.exists()) {
        return [];
    }

    const messages: ChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
        messages.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
        });
    });

    return messages.sort((a, b) => a.sentAt - b.sentAt);
}

// Get messages between two users
export async function getDirectMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    const messagesRef = ref(database, 'messages');
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
        return [];
    }

    const messages: ChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        if (
            (message.senderId === userId1 && message.recipientId === userId2) ||
            (message.senderId === userId2 && message.recipientId === userId1)
        ) {
            messages.push({
                id: childSnapshot.key!,
                ...message,
            });
        }
    });

    return messages.sort((a, b) => a.sentAt - b.sentAt);
}

// Send a message
export async function sendMessage(message: Omit<ChatMessage, 'id' | 'sentAt' | 'isRead'>): Promise<string> {
    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef);

    const messageData: ChatMessage = {
        ...message,
        sentAt: Date.now(),
        isRead: false,
    };

    await set(newMessageRef, messageData);

    // Update or create chat room
    await updateChatRoom(message.senderId, message.recipientId, message.caseId, message.content);

    return newMessageRef.key!;
}

// Mark message as read
export async function markMessageAsRead(messageId: string): Promise<void> {
    const messageRef = ref(database, `messages/${messageId}`);
    await update(messageRef, {
        isRead: true,
        readAt: Date.now(),
    });
}

// Update or create chat room
async function updateChatRoom(
    userId1: string,
    userId2: string,
    caseId?: string,
    lastMessage?: string
): Promise<void> {
    const participants = [userId1, userId2].sort();
    const roomId = caseId || participants.join('_');

    const roomRef = ref(database, `chatRooms/${roomId}`);
    const snapshot = await get(roomRef);

    const now = Date.now();

    if (!snapshot.exists()) {
        // Create new room
        const room: ChatRoom = {
            participants,
            caseId,
            lastMessage,
            lastMessageAt: now,
            unreadCount: {
                [userId2]: 1,
            },
            createdAt: now,
            updatedAt: now,
        };
        await set(roomRef, room);
    } else {
        // Update existing room
        const currentUnread = snapshot.val().unreadCount || {};
        await update(roomRef, {
            lastMessage,
            lastMessageAt: now,
            updatedAt: now,
            [`unreadCount/${userId2}`]: (currentUnread[userId2] || 0) + 1,
        });
    }
}

// Get user's chat rooms
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    const roomsRef = ref(database, 'chatRooms');
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
        return [];
    }

    const rooms: ChatRoom[] = [];
    snapshot.forEach((childSnapshot) => {
        const room = childSnapshot.val();
        if (room.participants && room.participants.includes(userId)) {
            rooms.push({
                id: childSnapshot.key!,
                ...room,
            });
        }
    });

    return rooms.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
}

// Subscribe to messages for a case (real-time)
export function subscribeToCaseMessages(
    caseId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const messagesRef = ref(database, 'messages');
    const caseMessagesQuery = query(messagesRef, orderByChild('caseId'), equalTo(caseId));

    onValue(caseMessagesQuery, (snapshot: DataSnapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
            messages.push({
                id: childSnapshot.key!,
                ...childSnapshot.val(),
            });
        });
        callback(messages.sort((a, b) => a.sentAt - b.sentAt));
    });

    return () => off(caseMessagesQuery);
}

// Subscribe to user's chat rooms (real-time)
export function subscribeToUserChatRooms(
    userId: string,
    callback: (rooms: ChatRoom[]) => void
): () => void {
    const roomsRef = ref(database, 'chatRooms');

    onValue(roomsRef, (snapshot: DataSnapshot) => {
        const rooms: ChatRoom[] = [];
        snapshot.forEach((childSnapshot) => {
            const room = childSnapshot.val();
            if (room.participants && room.participants.includes(userId)) {
                rooms.push({
                    id: childSnapshot.key!,
                    ...room,
                });
            }
        });
        callback(rooms.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)));
    });

    return () => off(roomsRef);
}

// Reset unread count for a chat room
export async function resetUnreadCount(roomId: string, userId: string): Promise<void> {
    const roomRef = ref(database, `chatRooms/${roomId}`);
    await update(roomRef, {
        [`unreadCount/${userId}`]: 0,
    });
}

// Delete a message
export async function deleteMessage(messageId: string): Promise<void> {
    const messageRef = ref(database, `messages/${messageId}`);
    await set(messageRef, null);
}

