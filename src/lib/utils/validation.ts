// Validation utilities for Patrick Travel Services

import { z } from 'zod';
import { PASSWORD_CONFIG, FILE_UPLOAD } from '../constants';

// Email validation schema
export const emailSchema = z.string().email('Invalid email address');

// Password validation schema
export const passwordSchema = z
    .string()
    .min(PASSWORD_CONFIG.MIN_LENGTH, `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Phone validation schema (optional)
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional();

// Name validation schema
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters');

// File size validation
export const isFileSizeValid = (fileSize: number): boolean => {
    return fileSize <= FILE_UPLOAD.MAX_SIZE;
};

// File type validation for images
export const isImageTypeValid = (mimeType: string): boolean => {
    return FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(mimeType);
};

// File type validation for documents
export const isDocumentTypeValid = (mimeType: string): boolean => {
    return FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(mimeType);
};

// Reference number generation
export const generateReferenceNumber = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `PTS-${timestamp}-${randomStr}`.toUpperCase();
};

// Validate UUID
export const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

