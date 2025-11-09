// Expo Push Notification Service
// Sends push notifications to mobile devices via Expo Push Notification API
// Documentation: https://docs.expo.dev/push-notifications/sending-notifications/

import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/db/prisma';

interface ExpoPushMessage {
  to: string | string[]; // Expo push token(s)
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushReceipt {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

/**
 * Send push notification to a single user
 *
 * @param userId - The user ID to send notification to
 * @param notification - Notification payload with title, body, optional data and badge
 * @returns Promise that resolves when notification is sent (or no tokens found)
 */
export async function sendPushNotificationToUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    channelId?: string; // Android notification channel ID
  }
): Promise<void> {
  try {
    logger.info('Looking up push tokens for user', { userId });

    // Get user's push tokens from database
    const pushTokenSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: `user:${userId}:pushToken:`,
        },
      },
    });

    if (pushTokenSettings.length === 0) {
      logger.info('No push tokens found for user', { userId });
      return;
    }

    logger.info('Found push tokens for user', {
      userId,
      tokenCount: pushTokenSettings.length,
      platforms: pushTokenSettings.map((s) => {
        const match = s.key.match(/pushToken:([^:]+)/);
        return match ? match[1] : 'unknown';
      }),
    });

    // Flatten tokens but remove duplicates per token value
    const uniqueTokenEntries = Array.from(
      pushTokenSettings
        .reduce((map, setting) => {
          if (!map.has(setting.value)) {
            map.set(setting.value, setting);
          }
          return map;
        }, new Map<string, (typeof pushTokenSettings)[number]>())
        .values()
    );

    const tokens = uniqueTokenEntries.map((setting) => setting.value);
    const tokenSettingsMap = new Map(uniqueTokenEntries.map((setting) => [setting.value, setting]));

    // Send notifications and get receipts for cleanup
    const results = await sendPushNotificationsWithCleanup(
      tokens,
      notification,
      tokenSettingsMap,
      userId
    );

    logger.info('Push notifications sent to user', {
      userId,
      tokenCount: tokens.length,
      sentCount: results.sent,
      failedCount: results.failed,
      title: notification.title,
    });
  } catch (error) {
    logger.error('Failed to send push notification to user', error, { userId });
    throw error;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    channelId?: string; // Android notification channel ID
  }
): Promise<void> {
  try {
    // Get all push tokens for these users
    const pushTokenSettings = await prisma.systemSetting.findMany({
      where: {
        OR: userIds.map((userId) => ({
          key: {
            startsWith: `user:${userId}:pushToken:`,
          },
        })),
      },
    });

    if (pushTokenSettings.length === 0) {
      logger.info('No push tokens found for users', { userIds });
      return;
    }

    const uniqueTokenEntries = Array.from(
      pushTokenSettings
        .reduce((map, setting) => {
          if (!map.has(setting.value)) {
            map.set(setting.value, setting);
          }
          return map;
        }, new Map<string, (typeof pushTokenSettings)[number]>())
        .values()
    );

    const tokens = uniqueTokenEntries.map((setting) => setting.value);
    const tokenSettingsMap = new Map(uniqueTokenEntries.map((setting) => [setting.value, setting]));

    // Group tokens by userId for better tracking
    // Extract userId from key: user:{userId}:pushToken:...
    const tokensByUser = new Map<string, string[]>();
    pushTokenSettings.forEach((setting) => {
      const match = setting.key.match(/^user:([^:]+):pushToken:/);
      if (match) {
        const userId = match[1];
        if (!tokensByUser.has(userId)) {
          tokensByUser.set(userId, []);
        }
        tokensByUser.get(userId)!.push(setting.value);
      }
    });

    // Send notifications for all users (tokens are sent together to Expo)
    // Note: Cleanup will work per-token, not per-user
    const results = await sendPushNotificationsWithCleanup(
      tokens,
      notification,
      tokenSettingsMap,
      'multiple_users'
    );

    logger.info('Push notifications sent to multiple users', {
      userCount: userIds.length,
      tokenCount: tokens.length,
      sentCount: results.sent,
      failedCount: results.failed,
      title: notification.title,
    });
  } catch (error) {
    logger.error('Failed to send push notifications to users', error, { userIds });
    throw error;
  }
}

/**
 * Send push notifications via Expo Push API with automatic cleanup of invalid tokens
 */
async function sendPushNotificationsWithCleanup(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
    channelId?: string; // Android notification channel ID
  },
  tokenSettingsMap: Map<string, { id: string; key: string }>,
  userId: string
): Promise<{ sent: number; failed: number }> {
  // Filter valid Expo push tokens
  const validTokens = tokens.filter(
    (token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );

  if (validTokens.length === 0) {
    logger.warn('No valid Expo push tokens found', { totalTokens: tokens.length });
    return { sent: 0, failed: 0 };
  }

  // Prepare push messages with Android channelId support
  // Expo Push Notification format: https://docs.expo.dev/push-notifications/sending-notifications/
  // Note: Expo handles conversion to FCM/APNS internally
  // Payload sent to Expo API:
  // {
  //   "to": "ExponentPushToken[...]",
  //   "title": "...",
  //   "body": "...",
  //   "data": {...},
  //   "priority": "high",
  //   "channelId": "emails"  // Android channel routing
  // }
  const messages: ExpoPushMessage[] = validTokens.map((token) => {
    const message: ExpoPushMessage = {
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: notification.sound !== null ? 'default' : null,
      badge: notification.badge !== undefined ? notification.badge : undefined,
      priority: 'high',
    };

    // Always include channelId if provided (required for Android notification channel routing)
    if (notification.channelId) {
      message.channelId = notification.channelId;
    }

    return message;
  });

  logger.debug('Prepared push notification messages', {
    messageCount: messages.length,
    channelId: notification.channelId || 'default',
    hasChannelId: messages.every((m) => m.channelId !== undefined),
  });

  // Send to Expo Push API
  try {
    logger.debug('Sending push notifications to Expo API', {
      messageCount: messages.length,
      channelId: notification.channelId || 'default',
      sampleMessage: messages[0]
        ? {
            to: messages[0].to?.toString().substring(0, 30) + '...',
            title: messages[0].title,
            channelId: messages[0].channelId,
            hasChannelId: !!messages[0].channelId,
          }
        : null,
    });

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 && errorText.includes('PUSH_TOO_MANY_EXPERIENCE_IDS')) {
        logger.warn('Expo reported mixed experience IDs, retrying per token', {
          userId,
          tokenCount: validTokens.length,
        });
        return await sendNotificationsPerToken(
          messages,
          validTokens,
          notification,
          tokenSettingsMap,
          userId
        );
      }
      throw new Error(`Expo API error: ${response.status} - ${errorText}`);
    }

    const receipts: { data: ExpoPushReceipt[] } = await response.json();

    const result = await processExpoReceipts(
      receipts.data,
      validTokens,
      tokenSettingsMap,
      userId,
      notification.channelId
    );

    logger.info('Push notifications sent to Expo', {
      totalSent: validTokens.length,
      ...result,
    });

    return { sent: result.successCount, failed: result.errorCount };
  } catch (error) {
    logger.error('Failed to send push notifications via Expo API', error);
    throw error;
  }
}

/**
 * Send push notifications via Expo Push API (legacy function - kept for backward compatibility)
 * @deprecated Use sendPushNotificationsWithCleanup instead
 */
async function sendPushNotifications(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
    channelId?: string; // Android notification channel ID
  }
): Promise<void> {
  // For backward compatibility, create a dummy map
  const dummyMap = new Map<string, { id: string; key: string }>();
  await sendPushNotificationsWithCleanup(tokens, notification, dummyMap, 'unknown');
}

async function sendNotificationsPerToken(
  messages: ExpoPushMessage[],
  validTokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
    channelId?: string;
  },
  tokenSettingsMap: Map<string, { id: string; key: string }>,
  userId: string
): Promise<{ sent: number; failed: number }> {
  const aggregatedReceipts: ExpoPushReceipt[] = [];
  const aggregatedTokens: string[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const token = validTokens[i];

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([message]),
      });

      if (!response.ok) {
        const text = await response.text();
        aggregatedReceipts.push({
          status: 'error',
          message: `HTTP ${response.status}: ${text}`,
        });
        aggregatedTokens.push(token);
        continue;
      }

      const receipts: { data: ExpoPushReceipt[] } = await response.json();
      aggregatedReceipts.push(receipts.data[0]);
      aggregatedTokens.push(token);
    } catch (err: any) {
      aggregatedReceipts.push({
        status: 'error',
        message: err?.message || 'Unexpected error during per-token send',
      });
      aggregatedTokens.push(token);
    }
  }

  const result = await processExpoReceipts(
    aggregatedReceipts,
    aggregatedTokens,
    tokenSettingsMap,
    userId,
    notification.channelId
  );

  logger.info('Push notifications sent to Expo (per-token fallback)', {
    totalSent: aggregatedTokens.length,
    ...result,
  });

  return { sent: result.successCount, failed: result.errorCount };
}

async function processExpoReceipts(
  receipts: ExpoPushReceipt[],
  tokens: string[],
  tokenSettingsMap: Map<string, { id: string; key: string }>,
  userId: string,
  channelId?: string
): Promise<{ successCount: number; errorCount: number; invalidTokensRemoved: number }> {
  const invalidTokenKeys: string[] = [];

  receipts.forEach((receipt, index) => {
    const token = tokens[index];
    const tokenSetting = tokenSettingsMap.get(token);

    if (receipt.status === 'error') {
      logger.error('Push notification delivery error', {
        tokenPrefix: token?.substring(0, 20) + '...',
        error: receipt.message,
        details: receipt.details,
        userId,
        channelId,
      });

      const invalidTokenErrors = ['DeviceNotRegistered', 'InvalidCredentials', 'MessageTooBig'];
      const errorCode = receipt.details?.error;
      if (errorCode && invalidTokenErrors.includes(errorCode) && tokenSetting) {
        invalidTokenKeys.push(tokenSetting.key);
      }
    }
  });

  if (invalidTokenKeys.length > 0) {
    await prisma.systemSetting.deleteMany({
      where: {
        key: {
          in: invalidTokenKeys,
        },
      },
    });

    logger.info('Removed invalid push tokens from database', {
      userId,
      removedCount: invalidTokenKeys.length,
    });
  }

  const successCount = receipts.filter((r) => r.status === 'ok').length;
  const errorCount = receipts.filter((r) => r.status === 'error').length;

  return {
    successCount,
    errorCount,
    invalidTokensRemoved: invalidTokenKeys.length,
  };
}

/**
 * Helper: Send case update notification
 */
export async function sendCaseUpdateNotification(
  userId: string,
  caseRef: string,
  status: string,
  caseId: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'Case Status Updated',
    body: `Your case ${caseRef} is now ${status}`,
    data: {
      type: 'CASE_STATUS_UPDATE',
      caseId,
      actionUrl: `/dashboard/cases/${caseId}`,
      screen: 'cases',
      params: { caseId },
    },
    channelId: 'cases',
  });
}

/**
 * Helper: Send new message notification
 */
export async function sendNewMessageNotification(
  userId: string,
  senderName: string,
  messagePreview: string,
  chatRoomId: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: `Message from ${senderName}`,
    body: messagePreview.substring(0, 100),
    data: {
      type: 'NEW_MESSAGE',
      actionUrl: '/dashboard/messages',
      screen: 'messages',
      params: { chatRoomId },
    },
    channelId: 'messages',
  });
}

/**
 * Helper: Send document status notification
 */
export async function sendDocumentStatusNotification(
  userId: string,
  documentName: string,
  status: 'APPROVED' | 'REJECTED',
  documentId: string
): Promise<void> {
  const emoji = status === 'APPROVED' ? '✅' : '❌';
  await sendPushNotificationToUser(userId, {
    title: `Document ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    body: `Your ${documentName} has been ${status.toLowerCase()}`,
    data: {
      type: 'DOCUMENT_STATUS_UPDATE',
      actionUrl: `/dashboard/documents`,
      screen: 'documents',
      params: { documentId, status },
    },
    channelId: 'documents',
  });
}

/**
 * Helper: Send case assignment notification (for agents)
 */
export async function sendCaseAssignmentNotification(
  agentId: string,
  caseRef: string,
  clientName: string,
  caseId: string
): Promise<void> {
  await sendPushNotificationToUser(agentId, {
    title: 'New Case Assigned',
    body: `Case ${caseRef} from ${clientName} has been assigned to you`,
    data: {
      type: 'CASE_ASSIGNED',
      caseId,
      actionUrl: `/dashboard/cases/${caseId}`,
      screen: 'cases',
      params: { caseId },
    },
    channelId: 'cases',
  });
}
