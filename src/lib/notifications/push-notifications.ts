// Browser Push Notifications using Web Push API
import { logger } from '@/lib/utils/logger';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  return await Notification.requestPermission();
}

export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/images/app-logo.png',
        badge: '/images/app-logo.png',
        ...options,
      });
      return true;
    } catch (error) {
      logger.error('Failed to create browser notification', error, {
        title,
        options: JSON.stringify(options),
      });
      return false;
    }
  }

  return false;
}

export async function showCaseUpdateNotification(caseRef: string, status: string): Promise<void> {
  await showNotification('Case Status Updated', {
    body: `Case ${caseRef} is now ${status}`,
    tag: `case-${caseRef}`,
    requireInteraction: true,
  });
}

export async function showDocumentNotification(
  documentName: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  await showNotification(status === 'approved' ? 'Document Approved' : 'Document Rejected', {
    body: `Your ${documentName} has been ${status}`,
    tag: `document-${documentName}`,
  });
}

export async function showMessageNotification(from: string, message: string): Promise<void> {
  await showNotification('New Message', {
    body: `${from}: ${message.substring(0, 100)}`,
    tag: 'new-message',
    requireInteraction: true,
  });
}
