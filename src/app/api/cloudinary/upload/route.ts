/**
 * Cloudinary Upload API Route
 * Used by mobile app for file uploads
 * Returns the secure URL of the uploaded file
 */

import { NextRequest } from 'next/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary/config';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Videos (optional)
  'video/mp4',
  'video/mpeg',
];

const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      'File upload service is not configured. Please contact support.',
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    throw new ApiError(
      'Invalid request format. Expected multipart/form-data.',
      HttpStatus.BAD_REQUEST
    );
  }

  // Get file from form data
  const file = formData.get('file') as File | null;

  if (!file) {
    throw new ApiError(
      'No file provided. Please include a file in the "file" field.',
      HttpStatus.BAD_REQUEST
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      HttpStatus.BAD_REQUEST
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ApiError(
      `File type "${file.type}" is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      HttpStatus.BAD_REQUEST
    );
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine resource type based on MIME type
  let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
  if (file.type.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.type.startsWith('video/')) {
    resourceType = 'video';
  } else {
    resourceType = 'raw';
  }

  // Get optional folder from form data
  const folder = (formData.get('folder') as string | null) || 'mobile-uploads';

  // Upload to Cloudinary
  logger.info('Uploading file to Cloudinary', {
    userId: req.user.userId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    folder,
  });

  try {
    const uploadResult = await uploadToCloudinary(buffer, {
      folder,
      resourceType,
    });

    logger.info('File uploaded successfully to Cloudinary', {
      userId: req.user.userId,
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      size: uploadResult.bytes,
    });

    // Return the secure URL and metadata
    return successResponse(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.name,
        fileSize: uploadResult.bytes,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        uploadedAt: uploadResult.created_at,
        uploadedBy: req.user.userId,
      },
      'File uploaded successfully',
      HttpStatus.CREATED
    );
  } catch (error: any) {
    logger.error('Cloudinary upload error', {
      error: error.message,
      userId: req.user.userId,
      fileName: file.name,
    });

    throw new ApiError(
      `Upload failed: ${error.message || 'Unknown error'}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Export POST handler with authentication, CORS, and rate limiting
// Note: OPTIONS preflight requests are automatically handled by withCorsMiddleware
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.UPLOAD)
);
