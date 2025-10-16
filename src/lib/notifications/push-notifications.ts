// Browser Push Notifications using Web Push API

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }

    return await Notification.requestPermission();
}

export async function showNotification(title: string, options?: NotificationOptions) {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
        new Notification(title, {
            icon: '/images/app-logo.png',
            badge: '/images/app-logo.png',
            ...options,
        });
    }
}

export function showCaseUpdateNotification(caseRef: string, status: string) {
    showNotification('Case Status Updated', {
        body: `Case ${caseRef} is now ${status}`,
        tag: `case-${caseRef}`,
        requireInteraction: true,
    });
}

export function showDocumentNotification(documentName: string, status: 'approved' | 'rejected') {
    showNotification(
        status === 'approved' ? 'Document Approved' : 'Document Rejected',
        {
            body: `Your ${documentName} has been ${status}`,
            tag: `document-${documentName}`,
        }
    );
}

export function showMessageNotification(from: string, message: string) {
    showNotification('New Message', {
        body: `${from}: ${message.substring(0, 100)}`,
        tag: 'new-message',
        requireInteraction: true,
    });
}
