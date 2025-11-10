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
  phone: z.string().optional().nullable(),
});

const AssignedAgentSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

const AppointmentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string().optional().nullable(),
});

const AppointmentSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  clientId: z.string(),
  createdById: z.string(),
  assignedAgentId: z.string().optional().nullable(),
  scheduledAt: z.string(),
  location: z.string(),
  notes: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']),
  reminderSentAt: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  assignedAgent: AppointmentUserSchema.optional().nullable(),
  createdBy: AppointmentUserSchema.optional().nullable(),
});

export const CaseSchema = z
  .object({
    id: z.string(),
    referenceNumber: z.string(),
    clientId: z.string(),
    assignedAgentId: z.string().optional().nullable(),
    destinationId: z.string().optional().nullable(),
    serviceType: z.string(),
    status: z.string(),
    priority: z.string(),
    submissionDate: z.string(),
    lastUpdated: z.string(),
    internalNotes: z.string().optional().nullable(),
    estimatedCompletion: z.string().optional().nullable(),
    completedAt: z.string().optional().nullable(),
    approvedAt: z.string().optional().nullable(),
    documents: z.array(DocumentSchema).optional(),
    client: ClientSchema.optional(),
    assignedAgent: AssignedAgentSchema.optional().nullable(),
    formData: z.any().optional().nullable(),
    appointments: z.array(AppointmentSchema).optional(),
  })
  .passthrough();

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
  appointments?: Appointment[];
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
  destinationId: string;
  priority?: Priority;
}

export interface UpdateCaseInput {
  serviceType?: string;
  status?: CaseStatus;
  priority?: Priority;
  internalNotes?: string;
}

export interface Appointment {
  id: string;
  caseId: string;
  clientId: string;
  createdById: string;
  assignedAgentId?: string | null;
  scheduledAt: string;
  location: string;
  notes?: string | null;
  status: AppointmentStatus;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedAgent?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string | null;
  } | null;
  createdBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string | null;
  } | null;
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  RESCHEDULED = 'RESCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CreateAppointmentInput {
  scheduledAt: string;
  location: string;
  notes?: string;
  assignedAgentId?: string;
}
