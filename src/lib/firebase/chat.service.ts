// Firebase Realtime Database service for chat/messaging
// Enhanced with presence tracking and typing indicators for mobile compatibility

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
    onDisconnect,
    serverTimestamp,
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

export interface UserPresence {
    userId: string;
    status: 'online' | 'offline' | 'away';
    lastSeen: number;
    platform?: 'web' | 'mobile' | 'desktop';
}

export interface TypingIndicator {
    userId: string;
    userName: string;
    chatRoomId: string;
    isTyping: boolean;
    timestamp: number;
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

// ============================================
// PRESENCE & ONLINE STATUS
// ============================================

/**
 * Set user online status and handle auto-disconnect
 * Compatible with mobile apps - automatically goes offline when connection lost
 */
export async function setUserOnline(userId: string, platform: 'web' | 'mobile' | 'desktop' = 'web'): Promise<void> {
    const presenceRef = ref(database, `presence/${userId}`);
    const userStatusOnline: UserPresence = {
        userId,
        status: 'online',
        lastSeen: Date.now(),
        platform,
    };

    const userStatusOffline: UserPresence = {
        userId,
        status: 'offline',
        lastSeen: Date.now(),
        platform,
    };

    // Set online status
    await set(presenceRef, userStatusOnline);

    // Set auto-disconnect to offline (for mobile & web)
    onDisconnect(presenceRef).set(userStatusOffline);
}

/**
 * Set user offline status
 */
export async function setUserOffline(userId: string): Promise<void> {
    const presenceRef = ref(database, `presence/${userId}`);
    await update(presenceRef, {
        status: 'offline',
        lastSeen: Date.now(),
    });
}

/**
 * Set user away status (idle for mobile apps)
 */
export async function setUserAway(userId: string): Promise<void> {
    const presenceRef = ref(database, `presence/${userId}`);
    await update(presenceRef, {
        status: 'away',
        lastSeen: Date.now(),
    });
}

/**
 * Get user presence status
 */
export async function getUserPresence(userId: string): Promise<UserPresence | null> {
    const presenceRef = ref(database, `presence/${userId}`);
    const snapshot = await get(presenceRef);

    if (snapshot.exists()) {
        return snapshot.val() as UserPresence;
    }

    return null;
}

/**
 * Subscribe to user presence status (real-time)
 * Mobile and web clients both receive instant updates
 */
export function subscribeToUserPresence(
    userId: string,
    callback: (presence: UserPresence | null) => void
): () => void {
    const presenceRef = ref(database, `presence/${userId}`);

    onValue(presenceRef, (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as UserPresence);
        } else {
            callback(null);
        }
    });

    return () => off(presenceRef);
}

/**
 * Subscribe to multiple users presence (for chat lists)
 * PERFORMANCE: Uses Set for O(1) lookups instead of array includes
 */
export function subscribeToMultipleUserPresence(
    userIds: string[],
    callback: (presences: Record<string, UserPresence>) => void
): () => void {
    const presenceRef = ref(database, 'presence');
    const userIdSet = new Set(userIds); // PERFORMANCE: O(1) lookup vs O(n) for array
    
    onValue(presenceRef, (snapshot: DataSnapshot) => {
        const presences: Record<string, UserPresence> = {};
        
        snapshot.forEach((childSnapshot) => {
            const userId = childSnapshot.key;
            if (userId && userIdSet.has(userId)) {
                presences[userId] = childSnapshot.val() as UserPresence;
            }
        });
        
        callback(presences);
    });

    return () => off(presenceRef);
}

// ============================================
// TYPING INDICATORS
// ============================================

/**
 * Set typing indicator for current user in a chat room
 * Mobile apps can use this to show "Agent is typing..."
 */
export async function setTyping(userId: string, userName: string, chatRoomId: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(database, `typing/${chatRoomId}/${userId}`);

    if (isTyping) {
        const typingData: TypingIndicator = {
            userId,
            userName,
            chatRoomId,
            isTyping: true,
            timestamp: Date.now(),
        };
        await set(typingRef, typingData);

        // Auto-clear typing after 5 seconds
        onDisconnect(typingRef).remove();
    } else {
        await set(typingRef, null);
    }
}

/**
 * Subscribe to typing indicators for a chat room (real-time)
 * PERFORMANCE: Filters out stale indicators (>5s old) client-side
 */
export function subscribeToTyping(
    chatRoomId: string,
    currentUserId: string,
    callback: (typingUsers: TypingIndicator[]) => void
): () => void {
    const typingRef = ref(database, `typing/${chatRoomId}`);

    onValue(typingRef, (snapshot: DataSnapshot) => {
        const typingUsers: TypingIndicator[] = [];
        const now = Date.now();
        const STALE_THRESHOLD = 5000; // 5 seconds
        
        snapshot.forEach((childSnapshot) => {
            const typing = childSnapshot.val() as TypingIndicator;
            // PERFORMANCE: Only include active typing (not current user, recent timestamp)
            if (typing && 
                typing.userId !== currentUserId && 
                typing.isTyping &&
                (now - typing.timestamp) < STALE_THRESHOLD) {
                typingUsers.push(typing);
            }
        });
        
        callback(typingUsers);
    });

    return () => off(typingRef);
}

// ============================================
// ENHANCED REAL-TIME MESSAGE SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new messages in a chat room (real-time)
 * Enhanced for mobile compatibility
 */
export function subscribeToRoomMessages(
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const messagesRef = ref(database, 'messages');
    const roomMessagesQuery = query(messagesRef, orderByChild('chatRoomId'), equalTo(chatRoomId));

    onValue(roomMessagesQuery, (snapshot: DataSnapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
            messages.push({
                id: childSnapshot.key!,
                ...childSnapshot.val(),
            });
        });
        callback(messages.sort((a, b) => a.sentAt - b.sentAt));
    });

    return () => off(roomMessagesQuery);
}

/**
 * Subscribe to direct messages between two users (real-time)
 * For mobile 1-on-1 chats
 */
export function subscribeToDirectMessages(
    userId1: string,
    userId2: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const messagesRef = ref(database, 'messages');

    onValue(messagesRef, (snapshot: DataSnapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val() as ChatMessage;
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
        callback(messages.sort((a, b) => a.sentAt - b.sentAt));
    });

    return () => off(messagesRef);
}
// Delete a message
export async function deleteMessage(messageId: string): Promise<void> {
    const messageRef = ref(database, `messages/${messageId}`);
    await set(messageRef, null);
}

