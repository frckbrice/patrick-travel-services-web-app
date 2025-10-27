// Notification Service - Handle creating notifications for various events
// Performance-optimized with batching and retry logic

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';

export interface CreateNotificationParams {
  userId: string;
  type:
    | 'NEW_MESSAGE'
    | 'CASE_STATUS_UPDATE'
    | 'DOCUMENT_UPLOADED'
    | 'CASE_ASSIGNED'
    | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  caseId?: string;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Queue for batch processing (performance optimization)
const notificationQueue: CreateNotificationParams[] = [];
let batchProcessTimer: NodeJS.Timeout | null = null;
const BATCH_DELAY = 1000; // 1 second
const MAX_BATCH_SIZE = 50;

/**
 * Create a notification with retry logic
 * Uses batching for performance when multiple notifications are created
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    // Add to queue
    notificationQueue.push(params);

    // Process immediately if queue is full
    if (notificationQueue.length >= MAX_BATCH_SIZE) {
      await processBatch();
    } else {
      // Schedule batch processing
      if (batchProcessTimer) {
        clearTimeout(batchProcessTimer);
      }
      batchProcessTimer = setTimeout(processBatch, BATCH_DELAY);
    }
  } catch (error) {
    logger.error('Failed to queue notification', error, { userId: params.userId });
  }
}

/**
 * Process queued notifications in batch (performance optimization)
 */
async function processBatch(): Promise<void> {
  if (notificationQueue.length === 0) return;

  // Get all notifications from queue
  const batch = notificationQueue.splice(0, notificationQueue.length);

  try {
    // Create all notifications in database (single transaction)
    const notifications = await prisma.notification.createMany({
      data: batch.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        caseId: n.caseId || null,
        actionUrl: n.actionUrl || null,
        isRead: false,
      })),
    });

    logger.info('Batch notifications created', {
      count: batch.length,
    });

    // Send Firebase real-time notifications (fire-and-forget)
    // Don't wait for these to complete
    batch.forEach((n) => {
      createRealtimeNotification(n.userId, {
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
      }).catch((error) => {
        logger.warn('Failed to send real-time notification', {
          error,
          userId: n.userId,
        });
      });
    });

    // TODO: Send push notifications for high priority
    // TODO: Send email notifications based on user preferences
  } catch (error) {
    logger.error('Failed to create batch notifications', error);

    // Retry logic: Add failed items back to queue
    batch.forEach((n) => notificationQueue.unshift(n));

    // Schedule retry after 5 seconds
    setTimeout(processBatch, 5000);
  }
}

/**
 * Create notification for new message
 */
export async function notifyNewMessage(params: {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  caseId?: string;
  caseReference?: string;
}): Promise<void> {
  const { recipientId, senderName, messagePreview, caseId, caseReference } = params;

  const preview =
    messagePreview.length > 100 ? `${messagePreview.substring(0, 100)}...` : messagePreview;

  const title = `New message from ${senderName}`;
  const message = caseReference ? `Case ${caseReference}: ${preview}` : preview;

  const actionUrl = caseId ? `/dashboard/messages?caseId=${caseId}` : `/dashboard/messages`;

  await createNotification({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    title,
    message,
    caseId,
    actionUrl,
    priority: 'high',
  });
}

/**
 * Create notification for case update
 */
export async function notifyCaseUpdate(params: {
  userId: string;
  caseId: string;
  caseReference: string;
  updateType: string;
  message: string;
}): Promise<void> {
  const { userId, caseId, caseReference, updateType, message } = params;

  await createNotification({
    userId,
    type: 'CASE_STATUS_UPDATE',
    title: `Case ${caseReference} - ${updateType}`,
    message,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
    priority: 'medium',
  });
}

/**
 * Create notification for case assignment
 */
export async function notifyCaseAssigned(params: {
  clientId: string;
  agentId: string;
  caseId: string;
  caseReference: string;
  agentName: string;
}): Promise<void> {
  const { clientId, agentId, caseId, caseReference, agentName } = params;

  // Notify client
  await createNotification({
    userId: clientId,
    type: 'CASE_ASSIGNED',
    title: 'Case Assigned',
    message: `Your case ${caseReference} has been assigned to ${agentName}`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
    priority: 'high',
  });

  // Notify agent
  await createNotification({
    userId: agentId,
    type: 'CASE_ASSIGNED',
    title: 'New Case Assigned',
    message: `You have been assigned to case ${caseReference}`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
    priority: 'high',
  });
}

/**
 * Flush all pending notifications (call on server shutdown)
 */
export async function flushNotifications(): Promise<void> {
  if (batchProcessTimer) {
    clearTimeout(batchProcessTimer);
    batchProcessTimer = null;
  }
  await processBatch();
}
