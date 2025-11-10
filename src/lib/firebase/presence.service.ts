// Firebase presence & typing utilities shared across web and mobile clients
// Handles robust online/offline tracking and per-chat typing indicators

import {
  onDisconnect,
  onValue,
  off,
  ref,
  remove,
  serverTimestamp,
  set,
  Unsubscribe,
} from 'firebase/database';
import { auth, database } from './firebase-client';
import { logger } from '@/lib/utils/logger';

type PresencePlatform = 'web' | 'mobile' | 'desktop';

interface PresenceRecord {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: object | number;
  platform?: PresencePlatform;
}

interface TypingRecord {
  userId: string;
  userName?: string;
  isTyping: boolean;
  timestamp: object | number;
}

const connectionListeners = new Map<string, Unsubscribe>();

function createPresenceRecord(
  userId: string,
  status: 'online' | 'offline',
  platform: PresencePlatform
): PresenceRecord {
  return {
    userId,
    status,
    lastSeen: serverTimestamp(),
    platform,
  };
}

/**
 * Begin tracking a user's presence. Automatically registers an onDisconnect handler
 * so the user flips to offline even if the browser/app crashes or loses network.
 *
 * Returns a cleanup function that stops listening to the connection status.
 */
export function setUserOnline(userUid: string, platform: PresencePlatform = 'web'): () => void {
  if (typeof window === 'undefined' || !userUid) {
    return () => undefined;
  }

  // Avoid duplicating listeners for the same user
  const existingListener = connectionListeners.get(userUid);
  if (existingListener) {
    existingListener();
  }

  const userStatusRef = ref(database, `presence/${userUid}`);
  const connectedRef = ref(database, '.info/connected');
  const offlineRecord = createPresenceRecord(userUid, 'offline', platform);
  const onlineRecord = createPresenceRecord(userUid, 'online', platform);

  const unsubscribe = onValue(
    connectedRef,
    (snapshot) => {
      const isConnected = snapshot.val();
      if (!isConnected) {
        return;
      }

      onDisconnect(userStatusRef)
        .set(offlineRecord)
        .catch((error) => {
          logger.error('Failed to register presence onDisconnect handler', error, {
            userUid: userUid.substring(0, 8),
          });
        })
        .then(() => {
          set(userStatusRef, onlineRecord).catch((error) => {
            logger.error('Failed to set user online status', error, {
              userUid: userUid.substring(0, 8),
            });
          });
        });
    },
    (error) => {
      logger.error('Presence connection listener error', error, {
        userUid: userUid.substring(0, 8),
      });
    }
  );

  connectionListeners.set(userUid, unsubscribe);

  return () => {
    const listener = connectionListeners.get(userUid);
    if (listener) {
      listener();
      connectionListeners.delete(userUid);
      off(connectedRef);
    }
  };
}

/**
 * Explicitly mark a user as offline. Useful during manual logout or cleanup.
 */
export function setUserOffline(
  userUid: string,
  platform: PresencePlatform = 'web'
): Promise<void> | undefined {
  if (typeof window === 'undefined' || !userUid) {
    return undefined;
  }

  const userStatusRef = ref(database, `presence/${userUid}`);
  const offlineRecord = createPresenceRecord(userUid, 'offline', platform);

  try {
    const disconnectListener = connectionListeners.get(userUid);
    if (disconnectListener) {
      disconnectListener();
      connectionListeners.delete(userUid);
    }
    return set(userStatusRef, offlineRecord);
  } catch (error) {
    logger.error('Failed to set user offline status', error, {
      userUid: userUid.substring(0, 8),
    });
    return undefined;
  }
}

/**
 * Update the typing state for a given chat room.
 * Stores lightweight records at /typing/{chatId}/{userUid}.
 */
export function setTyping(
  userUid: string,
  userName: string | undefined,
  chatRoomId: string,
  isTyping: boolean
): Promise<void> | undefined {
  if (typeof window === 'undefined' || !userUid || !chatRoomId) {
    return undefined;
  }

  const typingRef = ref(database, `typing/${chatRoomId}/${userUid}`);

  const typingRecord: TypingRecord = {
    userId: userUid,
    userName,
    isTyping,
    timestamp: serverTimestamp(),
  };

  // When not typing we still persist the record with isTyping=false so listeners receive updates.
  return set(typingRef, typingRecord).catch((error) => {
    logger.error('Failed to update typing indicator', error, {
      chatRoomId: chatRoomId.substring(0, 8),
      userUid: userUid.substring(0, 8),
      isTyping,
    });
    throw error;
  });
}

/**
 * Ensure the typing flag is cleared if the client disconnects unexpectedly.
 */
export function registerTypingOnDisconnect(chatRoomId: string, userUid: string): void {
  if (typeof window === 'undefined' || !chatRoomId || !userUid) {
    return;
  }

  const typingRef = ref(database, `typing/${chatRoomId}/${userUid}`);

  onDisconnect(typingRef)
    .remove()
    .catch((error) => {
      logger.error('Failed to register typing onDisconnect cleanup', error, {
        chatRoomId: chatRoomId.substring(0, 8),
        userUid: userUid.substring(0, 8),
      });
    });
}

/**
 * Immediately removes the typing record for a user within a chat.
 */
export function clearTyping(chatRoomId: string, userUid: string): Promise<void> | undefined {
  if (typeof window === 'undefined' || !chatRoomId || !userUid) {
    return undefined;
  }

  const typingRef = ref(database, `typing/${chatRoomId}/${userUid}`);
  return remove(typingRef).catch((error) => {
    logger.error('Failed to clear typing indicator', error, {
      chatRoomId: chatRoomId.substring(0, 8),
      userUid: userUid.substring(0, 8),
    });
    throw error;
  });
}
