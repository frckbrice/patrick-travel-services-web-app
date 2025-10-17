// Types for Cases feature

export interface Document {
    id: string;
    originalName: string;
    documentType: string;
    uploadDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    filePath: string;
}

export interface Case {
    id: string;
    referenceNumber: string;
    clientId: string;
    assignedAgentId?: string;
    serviceType: string;
    status: CaseStatus;
    priority: Priority;
    submissionDate: string;
    lastUpdated: string;
    internalNotes?: string;
    estimatedCompletion?: string;
    completedAt?: string;
    approvedAt?: string;
    documents?: Document[];
    client?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
    };
    assignedAgent?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
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

export interface CreateCaseInput {
    serviceType: string;
    priority?: Priority;
}

export interface UpdateCaseInput {
    serviceType?: string;
    status?: CaseStatus;
    priority?: Priority;
    internalNotes?: string;
}

