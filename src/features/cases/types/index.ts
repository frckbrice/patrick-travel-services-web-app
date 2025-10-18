// Types for Cases feature
import { z } from 'zod';

// Zod schemas for runtime validation
const DocumentSchema = z.object({
  id: z.string(),
  originalName: z.string(),
  documentType: z.string(),
  uploadDate: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  filePath: z.string(),
});

const ClientSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
});

const AssignedAgentSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const CaseSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  clientId: z.string(),
  assignedAgentId: z.string().optional(),
  serviceType: z.string(),
  status: z.string(),
  priority: z.string(),
  submissionDate: z.string(),
  lastUpdated: z.string(),
  internalNotes: z.string().optional(),
  estimatedCompletion: z.string().optional(),
  completedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  documents: z.array(DocumentSchema).optional(),
  client: ClientSchema.optional(),
  assignedAgent: AssignedAgentSchema.optional(),
});

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
