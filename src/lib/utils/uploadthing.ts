import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react';

import type { OurFileRouter } from '@/app/api/uploadthing/core';

/**
 * UploadThing React helpers
 * Provides hooks and utilities for file uploads
 */
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

/**
 * Pre-built Upload Button component
 * Usage: <UploadButton endpoint="imageUploader" onClientUploadComplete={...} />
 */
export const UploadButton = generateUploadButton<OurFileRouter>();

/**
 * Pre-built Upload Dropzone component
 * Usage: <UploadDropzone endpoint="documentUploader" onClientUploadComplete={...} />
 */
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
