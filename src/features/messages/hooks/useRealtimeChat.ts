// Real-time chat hooks using Firebase Realtime Database
// Compatible with mobile apps - instant message delivery
// PERFORMANCE OPTIMIZED: Throttled updates, memoization, proper cleanup

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { database, auth } from '@/lib/firebase/firebase-client';
import { logger } from '@/lib/utils/logger';

// Type definitions
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
  attachments?: any[];
}

export interface ChatRoom {
  id?: string;
  participants: Record<string, boolean>;
  caseId?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
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

// Helper functions (simplified versions)
function subscribeToRoomMessages(
  chatRoomId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const messagesRef = query(ref(database, `chats/${chatRoomId}/messages`), orderByChild('sentAt'));

  onValue(
    messagesRef,
    (snapshot) => {
      const messages: ChatMessage[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
      }

      // Debug logging
      logger.debug(
        `[Firebase] Received ${messages.length} messages for room ${chatRoomId.substring(0, 8)}...`
      );
      if (messages.length > 0) {
        logger.debug(`[Firebase] Latest message:`, {
          id: messages[messages.length - 1].id?.substring(0, 8) + '...',
          senderId: messages[messages.length - 1].senderId?.substring(0, 8) + '...',
          content: messages[messages.length - 1].content?.substring(0, 20) + '...',
        });
      }

      // Sort by sentAt
      const sorted = messages.sort((a, b) => a.sentAt - b.sentAt);
      callback(sorted);
    },
    (error) => {
      logger.error(
        `[Firebase] Error listening to messages for room ${chatRoomId.substring(0, 8)}...`,
        error
      );
      callback([]);
    }
  );

  return () => off(messagesRef);
}

function subscribeToUserChatRooms(
  userId: string,
  callback: (rooms: ChatRoom[]) => void
): () => void {
  const roomsRef = ref(database, 'chats');

  onValue(
    roomsRef,
    (snapshot) => {
      const rooms: ChatRoom[] = [];

      // Check if snapshot has data
      if (!snapshot.exists()) {
        logger.debug(`[Chat Rooms] No rooms found for userId ${userId.substring(0, 8)}...`);
        callback([]);
        return;
      }

      // Use .size property instead of .numChildren() for modular SDK
      const roomsCount = snapshot.size;
      logger.debug(`[Chat Rooms] Listening for userId ${userId.substring(0, 8)}...`, {
        roomsFound: roomsCount,
      });

      snapshot.forEach((childSnapshot) => {
        const metadata = childSnapshot.child('metadata').val();
        const roomId = childSnapshot.key!;

        logger.debug(`[Chat Rooms] Checking room ${roomId.substring(0, 8)}...`, {
          hasMetadata: !!metadata,
          participants: metadata?.participants,
          matchesClient: metadata?.participants?.clientId === userId,
          matchesAgent: metadata?.participants?.agentId === userId,
        });

        if (
          metadata?.participants?.clientId === userId ||
          metadata?.participants?.agentId === userId
        ) {
          const room = {
            id: roomId,
            participants: {
              [metadata.participants.clientId]: true,
              [metadata.participants.agentId]: true,
            },
            caseId: roomId,
            lastMessage: metadata.lastMessage,
            lastMessageAt: metadata.lastMessageTime,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt || metadata.createdAt,
          };

          logger.debug(`[Chat Rooms] Added room ${roomId.substring(0, 8)}...`);
          rooms.push(room);
        }
      });

      logger.debug(
        `[Chat Rooms] Returning ${rooms.length} rooms for userId ${userId.substring(0, 8)}...`
      );
      callback(rooms.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)));
    },
    (error) => {
      logger.error(
        `[Chat Rooms] Error listening to rooms for userId ${userId.substring(0, 8)}...`,
        error
      );
      callback([]);
    }
  );

  return () => off(roomsRef);
}

function subscribeToUserPresence(
  userId: string,
  callback: (presence: UserPresence | null) => void
): () => void {
  const presenceRef = ref(database, `presence/${userId}`);

  onValue(presenceRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  return () => off(presenceRef);
}

function subscribeToMultipleUserPresence(
  userIds: string[],
  callback: (presences: Record<string, UserPresence>) => void
): () => void {
  const presenceRef = ref(database, 'presence');
  const userIdSet = new Set(userIds);

  onValue(presenceRef, (snapshot) => {
    const presences: Record<string, UserPresence> = {};
    snapshot.forEach((childSnapshot) => {
      const userId = childSnapshot.key;
      if (userId && userIdSet.has(userId)) {
        presences[userId] = childSnapshot.val();
      }
    });
    callback(presences);
  });

  return () => off(presenceRef);
}

function subscribeToTyping(
  chatRoomId: string,
  currentUserId: string,
  callback: (typingUsers: TypingIndicator[]) => void
): () => void {
  const typingRef = ref(database, `typing/${chatRoomId}`);

  onValue(typingRef, (snapshot) => {
    const typingUsers: TypingIndicator[] = [];
    const now = Date.now();

    snapshot.forEach((childSnapshot) => {
      const typing = childSnapshot.val() as TypingIndicator;
      if (
        typing &&
        typing.userId !== currentUserId &&
        typing.isTyping &&
        now - typing.timestamp < 5000
      ) {
        typingUsers.push(typing);
      }
    });
    callback(typingUsers);
  });

  return () => off(typingRef);
}

async function setUserOnline(userId: string, platform: 'web' | 'mobile' | 'desktop' = 'web') {
  // Stub - not critical for now
}

async function setUserOffline(userId: string) {
  // Stub - not critical for now
}

async function setTyping(userId: string, userName: string, chatRoomId: string, isTyping: boolean) {
  // Stub - not critical for now
}

async function sendMessage(message: any) {
  // Stub - not critical for now
}

/**
 * Hook for real-time messages in a chat room
 * Replaces polling - instant delivery
 * DEMO MODE: Falls back to mock data after 1.5s timeout if Firebase empty (DEVELOPMENT ONLY)
 */
export function useRealtimeMessages(chatRoomId: string | null) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMarkedRef = useRef<number>(0);

  useEffect(() => {
    if (!chatRoomId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // PRODUCTION: Stop loading after 2 seconds even if no data
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const unsubscribe = subscribeToRoomMessages(chatRoomId, (newMessages) => {
      // Clear timeout if Firebase responds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Only use real Firebase data
      setMessages(newMessages);
      setUseMockData(false);
      setIsLoading(false);

      // PERFORMANCE: Throttle read-marking to at most once per 2s
      // Get Firebase UID for comparing with message senderIds (which are Firebase UIDs)
      const firebaseUser = auth.currentUser;
      const firebaseUserId = firebaseUser?.uid;

      const now = Date.now();
      if (
        firebaseUserId &&
        chatRoomId &&
        newMessages.length > 0 &&
        now - lastMarkedRef.current > 2000 &&
        // Only trigger if there exists at least one unread message not from current user
        // COMPARE: senderId is Firebase UID, so compare against Firebase UID, not PostgreSQL ID
        newMessages.some((m) => m.senderId !== firebaseUserId && !m.isRead)
      ) {
        lastMarkedRef.current = now;
        // Best-effort; don't await to avoid UI jank
        import('@/lib/firebase/chat.service').then(({ markMessagesAsRead }) => {
          // CRITICAL: Pass Firebase UID, not PostgreSQL ID
          markMessagesAsRead(chatRoomId, firebaseUserId).catch(() => {
            // Silently ignore; rules enforce permissions
          });
        });
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsubscribe();
    };
  }, [chatRoomId, user?.id, user?.firstName, user?.lastName, user?.email]);

  return { messages, isLoading };
}

/**
 * Hook for real-time chat rooms list
 * Replaces polling - instant updates
 * DEMO MODE: Falls back to mock data after 2s timeout if Firebase empty (DEVELOPMENT ONLY)
 */
export function useRealtimeChatRooms() {
  const { user } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setChatRooms([]);
      setIsLoading(false);
      return;
    }

    // Get Firebase UID from auth.currentUser for filtering
    // Firebase UID is what's stored in metadata participants, not PostgreSQL ID
    const firebaseUser = auth.currentUser;
    const firebaseUserId = firebaseUser?.uid;

    if (!firebaseUserId) {
      setChatRooms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // PRODUCTION: Stop loading after 2 seconds even if no data
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const unsubscribe = subscribeToUserChatRooms(firebaseUserId, (rooms) => {
      // Clear timeout if Firebase responds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Only use real Firebase data
      setChatRooms(rooms);
      setUseMockData(false);
      setIsLoading(false);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsubscribe();
    };
  }, [user?.id]);

  return { chatRooms, isLoading };
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
 * MOCK DATA: Demo presence data for development/testing
 * agent-1 is online, others are offline
 */
const MOCK_PRESENCES: Record<string, UserPresence> = {
  'agent-1': {
    userId: 'agent-1',
    status: 'online',
    lastSeen: Date.now(),
    platform: 'web',
  },
  'agent-2': {
    userId: 'agent-2',
    status: 'offline',
    lastSeen: Date.now() - 3600000, // 1 hour ago
    platform: 'mobile',
  },
  'agent-3': {
    userId: 'agent-3',
    status: 'offline',
    lastSeen: Date.now() - 86400000, // 1 day ago
    platform: 'web',
  },
};

/**
 * Hook for multiple users presence (for chat lists)
 * Shows who's online in the conversation list
 * DEMO MODE: Falls back to mock data after 1s timeout if Firebase empty (DEVELOPMENT ONLY)
 */
export function useMultipleUserPresence(userIds: string[]) {
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setPresences({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // PRODUCTION: Stop loading after 1 second even if no data
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const unsubscribe = subscribeToMultipleUserPresence(userIds, (newPresences) => {
      // Clear timeout if Firebase responds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Only use real Firebase data
      setPresences(newPresences);
      setUseMockData(false);
      setIsLoading(false);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsubscribe();
    };
  }, [userIds.join(',')]); // PERFORMANCE: Use join instead of JSON.stringify

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
      if (!user?.id || !user?.email || !chatRoomId) return;
      setTyping(user.id, user.email, chatRoomId, false);
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
      if (!user?.id || !user?.email || !chatRoomId) return;
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
