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
 */
export async function sendPushNotificationToUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
  }
): Promise<void> {
  try {
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

    const tokens = pushTokenSettings.map((setting) => setting.value);

    await sendPushNotifications(tokens, notification);

    logger.info('Push notifications sent to user', {
      userId,
      tokenCount: tokens.length,
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

    const tokens = pushTokenSettings.map((setting) => setting.value);

    await sendPushNotifications(tokens, notification);

    logger.info('Push notifications sent to multiple users', {
      userCount: userIds.length,
      tokenCount: tokens.length,
      title: notification.title,
    });
  } catch (error) {
    logger.error('Failed to send push notifications to users', error, { userIds });
    throw error;
  }
}

/**
 * Send push notifications via Expo Push API
 */
async function sendPushNotifications(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
  }
): Promise<void> {
  // Filter valid Expo push tokens
  const validTokens = tokens.filter(
    (token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );

  if (validTokens.length === 0) {
    logger.warn('No valid Expo push tokens found', { totalTokens: tokens.length });
    return;
  }

  // Prepare push messages
  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    sound: notification.sound !== null ? 'default' : null,
    badge: notification.badge,
    priority: 'high',
  }));

  // Send to Expo Push API
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo API error: ${response.status} - ${errorText}`);
    }

    const receipts: { data: ExpoPushReceipt[] } = await response.json();

    // Log any errors from Expo
    receipts.data.forEach((receipt, index) => {
      if (receipt.status === 'error') {
        logger.error('Push notification delivery error', {
          token: validTokens[index],
          error: receipt.message,
          details: receipt.details,
        });
      }
    });

    logger.info('Push notifications sent to Expo', {
      totalSent: validTokens.length,
      successCount: receipts.data.filter((r) => r.status === 'ok').length,
      errorCount: receipts.data.filter((r) => r.status === 'error').length,
    });
  } catch (error) {
    logger.error('Failed to send push notifications via Expo API', error);
    throw error;
  }
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
    title: '📋 Case Status Updated',
    body: `Your case ${caseRef} is now ${status}`,
    data: {
      type: 'CASE_STATUS_UPDATE',
      caseId,
      caseRef,
      status,
    },
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
    title: `💬 Message from ${senderName}`,
    body: messagePreview.substring(0, 100),
    data: {
      type: 'NEW_MESSAGE',
      chatRoomId,
      senderName,
    },
    badge: 1,
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
    title: `${emoji} Document ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    body: `Your ${documentName} has been ${status.toLowerCase()}`,
    data: {
      type: 'DOCUMENT_STATUS_UPDATE',
      documentId,
      status,
    },
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
    title: '👤 New Case Assigned',
    body: `Case ${caseRef} from ${clientName} has been assigned to you`,
    data: {
      type: 'CASE_ASSIGNED',
      caseId,
      caseRef,
    },
  });
}
