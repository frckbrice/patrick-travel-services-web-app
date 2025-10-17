// Shared TypeScript types for Patrick Travel Services

export enum Role {
    CLIENT = 'CLIENT',
    AGENT = 'AGENT',
    ADMIN = 'ADMIN',
}

export enum ServiceType {
    STUDENT_VISA = 'STUDENT_VISA',
    WORK_PERMIT = 'WORK_PERMIT',
    FAMILY_REUNIFICATION = 'FAMILY_REUNIFICATION',
    TOURIST_VISA = 'TOURIST_VISA',
    BUSINESS_VISA = 'BUSINESS_VISA',
    PERMANENT_RESIDENCY = 'PERMANENT_RESIDENCY',
}

export enum CaseStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',
    PROCESSING = 'PROCESSING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CLOSED = 'CLOSED',
}

export enum Priority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum DocumentType {
    PASSPORT = 'PASSPORT',
    ID_CARD = 'ID_CARD',
    BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
    MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
    DIPLOMA = 'DIPLOMA',
    EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
    BANK_STATEMENT = 'BANK_STATEMENT',
    PROOF_OF_RESIDENCE = 'PROOF_OF_RESIDENCE',
    PHOTO = 'PHOTO',
    OTHER = 'OTHER',
}

export enum DocumentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// Attachment Interface for Messages
export interface MessageAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}

export enum NotificationType {
    CASE_STATUS_UPDATE = 'CASE_STATUS_UPDATE',
    NEW_MESSAGE = 'NEW_MESSAGE',
    DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
    DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
    DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
    CASE_ASSIGNED = 'CASE_ASSIGNED',
    SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

// User Interface
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    profilePicture?: string | null;
    role: Role;
    isActive: boolean;
    isVerified: boolean;
    lastLogin?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// Case Interface
export interface Case {
    id: string;
    referenceNumber: string;
    clientId: string;
    assignedAgentId?: string | null;
    serviceType: ServiceType;
    status: CaseStatus;
    priority: Priority;
    submissionDate: Date;
    lastUpdated: Date;
    internalNotes?: string | null;
    estimatedCompletion?: Date | null;
}

// Document Interface
export interface Document {
    id: string;
    caseId: string;
    uploadedById: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    documentType: DocumentType;
    status: DocumentStatus;
    uploadDate: Date;
    verifiedBy?: string | null;
    verifiedAt?: Date | null;
    rejectionReason?: string | null;
}

// Message Interface
export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    caseId?: string | null;
    subject?: string | null;
    content: string;
    isRead: boolean;
    readAt?: Date | null;
    sentAt: Date;
    attachments?: MessageAttachment[];
}

// Notification Interface
export interface Notification {
    id: string;
    userId: string;
    caseId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: Date | null;
    createdAt: Date;
    actionUrl?: string | null;
}

// Status History Interface
export interface StatusHistory {
    id: string;
    caseId: string;
    status: CaseStatus;
    changedBy: string;
    notes?: string | null;
    timestamp: Date;
}

// Activity Log Metadata
export interface ActivityLogMetadata {
    caseId?: string;
    documentId?: string;
    messageId?: string;
    previousValue?: string;
    newValue?: string;
    additionalInfo?: string;
}

// Activity Log Interface
export interface ActivityLog {
    id: string;
    userId: string;
    action: string;
    description: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: ActivityLogMetadata;
    timestamp: Date;
}

// FAQ Interface
export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// JWT Payload Interface
export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    iat: number;
    exp: number;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// Case Form Field Value
export type FormFieldValue = string | number | boolean | Date | string[] | null;

// Case Form Data Types
export interface CaseFormData {
    id: string;
    caseId: string;
    data: Record<string, FormFieldValue>;
    createdAt: Date;
    updatedAt: Date;
}

// Statistics Types
export interface DashboardStats {
    totalClients: number;
    activeCases: number;
    pendingReviews: number;
    completedThisMonth: number;
}

export interface CasesByStatus {
    status: CaseStatus;
    count: number;
}

export interface CasesByService {
    serviceType: ServiceType;
    count: number;
}

