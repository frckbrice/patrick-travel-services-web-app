// REFACTORED: Performance-optimized user lookup for messages
// ZERO database calls - uses only Firebase message metadata

import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import type { ChatMessage } from '@/lib/firebase/chat.service';

interface UserInfo {
  id: string;
  fullName: string;
  role: string;
  email: string;
}

/**
 * PERFORMANCE-OPTIMIZED: Extract user info from Firebase messages
 * NO API calls - all data comes from message metadata
 *
 * Firebase messages contain sender/recipient info, so we don't need to fetch users!
 * This is MUCH faster and works for all user types (CLIENT, AGENT, ADMIN)
 */
export function useUserLookup(chatMessages?: ChatMessage[]) {
  const { user } = useAuthStore();

  // Create a performant lookup map from message metadata (O(1) access)
  const userMap = useMemo(() => {
    const map = new Map<string, UserInfo>();

    // Add current user to map
    if (user) {
      map.set(user.id, {
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
        email: user.email || '',
      });
    }

    // Extract participant info from messages
    if (chatMessages && chatMessages.length > 0) {
      chatMessages.forEach((message) => {
        // Add sender info if not already in map
        if (message.senderId && !map.has(message.senderId)) {
          map.set(message.senderId, {
            id: message.senderId,
            fullName: message.senderName || 'Unknown User',
            role: 'User', // Generic role from messages
            email: message.senderEmail || '',
          });
        }
        // Add recipient info if not already in map
        if (message.recipientId && !map.has(message.recipientId)) {
          map.set(message.recipientId, {
            id: message.recipientId,
            fullName: message.recipientName || 'Unknown User',
            role: 'User', // Generic role from messages
            email: message.recipientEmail || '',
          });
        }
      });
    }

    return map;
  }, [user, chatMessages]);

  // Lookup function for easy access
  const getUserInfo = (userId: string | undefined): UserInfo | null => {
    if (!userId) return null;

    const userInfo = userMap.get(userId);
    if (userInfo) return userInfo;

    // Graceful fallback for users not yet in map
    return {
      id: userId,
      fullName: 'Loading...',
      role: 'User',
      email: '',
    };
  };

  return {
    getUserInfo,
    userMap,
    isLoading: false, // No API calls = no loading
    error: null,
  };
}
