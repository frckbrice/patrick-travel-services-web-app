// Types for Documents feature

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
    uploadDate: string;
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
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

export interface CreateDocumentInput {
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    documentType: DocumentType;
    caseId: string;
}

