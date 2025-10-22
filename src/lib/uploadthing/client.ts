// UploadThing client configuration
// Based on: https://docs.uploadthing.com/getting-started/appdir

import { generateReactHelpers } from '@uploadthing/react';
import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { getFreshToken } from '@/lib/auth/token-manager';

// IMPORTANT: UploadThing uses your Next.js API route for authentication
// The route handler automatically receives cookies/headers from the browser
// Our middleware in /api/uploadthing/core.ts extracts the Authorization header
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

/**
 * Get authentication headers for UploadThing requests
 * @returns Headers object with Authorization token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getFreshToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
