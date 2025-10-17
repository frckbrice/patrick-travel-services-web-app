// Real-time chat hooks using Firebase Realtime Database
// Compatible with mobile apps - instant message delivery
// PERFORMANCE OPTIMIZED: Throttled updates, memoization, proper cleanup

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import {
    ChatMessage,
    ChatRoom,
    UserPresence,
    TypingIndicator,
    subscribeToRoomMessages,
    subscribeToUserChatRooms,
    subscribeToUserPresence,
    subscribeToMultipleUserPresence,
    subscribeToTyping,
    setUserOnline,
    setUserOffline,
    setTyping,
    sendMessage,
} from '@/lib/firebase/chat.service';

/**
 * Hook for real-time messages in a chat room
 * Replaces polling - instant delivery
 */
export function useRealtimeMessages(chatRoomId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!chatRoomId) {
            setMessages([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribe = subscribeToRoomMessages(chatRoomId, (newMessages) => {
            setMessages(newMessages);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [chatRoomId]);

    return { messages, isLoading, error };
}

/**
 * Hook for real-time chat rooms list
 * Replaces polling - instant updates
 */
export function useRealtimeChatRooms() {
    const { user } = useAuthStore();
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setChatRooms([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribe = subscribeToUserChatRooms(user.id, (rooms) => {
            setChatRooms(rooms);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [user?.id]);

    return { chatRooms, isLoading, error };
}

/**
 * Hook for user online presence
 * Shows online/offline/away status
 */
export function useUserPresence(userId: string | null) {
    const [presence, setPresence] = useState<UserPresence | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setPresence(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribe = subscribeToUserPresence(userId, (newPresence) => {
            setPresence(newPresence);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [userId]);

    return { presence, isLoading };
}

/**
 * Hook for multiple users presence (for chat lists)
 * Shows who's online in the conversation list
 */
export function useMultipleUserPresence(userIds: string[]) {
    const [presences, setPresences] = useState<Record<string, UserPresence>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userIds || userIds.length === 0) {
            setPresences({});
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribe = subscribeToMultipleUserPresence(userIds, (newPresences) => {
            setPresences(newPresences);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [JSON.stringify(userIds)]); // eslint-disable-line react-hooks/exhaustive-deps

    return { presences, isLoading };
}

/**
 * Hook for typing indicators
 * Shows "X is typing..." in real-time
 */
export function useTypingIndicators(chatRoomId: string | null) {
    const { user } = useAuthStore();
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

    useEffect(() => {
        if (!chatRoomId || !user?.id) {
            setTypingUsers([]);
            return;
        }

        const unsubscribe = subscribeToTyping(chatRoomId, user.id, (typing) => {
            setTypingUsers(typing);
        });

        return () => {
            unsubscribe();
        };
    }, [chatRoomId, user?.id]);

    return { typingUsers };
}

/**
 * Hook for setting current user's typing status
 * PERFORMANCE: Throttled to max 1 write per second, auto-clear after 3s
 */
export function useTypingStatus(chatRoomId: string | null) {
    const { user } = useAuthStore();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);
    const lastTypingUpdateRef = useRef<number>(0);

    const startTyping = useCallback(() => {
        if (!chatRoomId || !user?.id || !user?.email) return;

        const now = Date.now();
        const timeSinceLastUpdate = now - lastTypingUpdateRef.current;

        // PERFORMANCE: Only update Firebase if more than 1 second since last update
        if (!isTypingRef.current || timeSinceLastUpdate > 1000) {
            setTyping(user.id, user.email, chatRoomId, true);
            lastTypingUpdateRef.current = now;
            isTypingRef.current = true;
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop typing after 3 seconds of no activity
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(user.id, user.email!, chatRoomId, false);
            isTypingRef.current = false;
        }, 3000);
    }, [chatRoomId, user?.id, user?.email]);

    const stopTyping = useCallback(() => {
        if (!chatRoomId || !user?.id || !user?.email) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (isTypingRef.current) {
            setTyping(user.id, user.email, chatRoomId, false);
            isTypingRef.current = false;
        }
    }, [chatRoomId, user?.id, user?.email]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (chatRoomId && user?.id && user?.email) {
                setTyping(user.id, user.email, chatRoomId, false);
            }
        };
    }, [chatRoomId, user?.id, user?.email]);

    return { startTyping, stopTyping };
}

/**
 * Hook for managing user's online presence
 * Automatically sets user online and handles disconnect
 */
export function usePresenceManagement(platform: 'web' | 'mobile' | 'desktop' = 'web') {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.id) return;

        // Set user online
        setUserOnline(user.id, platform);

        // Set user offline on unmount
        return () => {
            if (user?.id) {
                setUserOffline(user.id);
            }
        };
    }, [user?.id, platform]);
}

/**
 * Combined hook for complete real-time chat functionality
 * Use this for the main chat component
 */
export function useRealtimeChat(chatRoomId: string | null) {
    const { messages, isLoading: messagesLoading } = useRealtimeMessages(chatRoomId);
    const { typingUsers } = useTypingIndicators(chatRoomId);
    const { startTyping, stopTyping } = useTypingStatus(chatRoomId);

    // Manage presence for current user
    usePresenceManagement('web');

    return {
        messages,
        isLoading: messagesLoading,
        typingUsers,
        startTyping,
        stopTyping,
    };
}

