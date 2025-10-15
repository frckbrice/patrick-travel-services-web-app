// Types for Notifications feature

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

export enum NotificationType {
    CASE_STATUS_UPDATE = 'CASE_STATUS_UPDATE',
    NEW_MESSAGE = 'NEW_MESSAGE',
    DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
    DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
    DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
    CASE_ASSIGNED = 'CASE_ASSIGNED',
    SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

export interface CreateNotificationInput {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
}

