// POST /api/users/avatar - Upload user avatar/profile picture

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

const handler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  try {
    // Define max file size (4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB

    // Check Content-Length header before parsing form data to prevent large payloads from being loaded into memory
    const contentLength = request.headers.get('content-length');

    if (!contentLength) {
      throw new ApiError('Content-Length header is required', HttpStatus.BAD_REQUEST);
    }

    const requestSize = parseInt(contentLength, 10);

    if (isNaN(requestSize) || requestSize <= 0) {
      throw new ApiError('Invalid Content-Length header', HttpStatus.BAD_REQUEST);
    }

    if (requestSize > maxSize) {
      throw new ApiError('Request size exceeds 4MB limit', HttpStatus.BAD_REQUEST);
    }

    // Get the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('No file provided', HttpStatus.BAD_REQUEST);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new ApiError('File must be an image', HttpStatus.BAD_REQUEST);
    }

    // Validate actual file size (defense in depth - Content-Length can be spoofed)
    if (file.size > maxSize) {
      throw new ApiError('Image size must be less than 4MB', HttpStatus.BAD_REQUEST);
    }

    // Get current user to check if they have an existing profile picture
    // This value will be used for optimistic locking
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { profilePicture: true },
    });

    const oldProfilePicture = currentUser?.profilePicture;

    // Upload the new file to UploadThing BEFORE deleting the old one
    // This ensures we don't delete a file if the upload fails
    const uploadResponse = await utapi.uploadFiles([file]);

    if (!uploadResponse || uploadResponse.length === 0) {
      throw new ApiError('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const result = uploadResponse[0];

    // Check for explicit error field
    if (result.error) {
      logger.error('UploadThing upload failed', {
        error: result.error,
        userId: req.user.userId,
      });
      throw new ApiError(
        result.error.message || 'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Only proceed if no error and data is present
    if (!result.data) {
      throw new ApiError(
        'Failed to upload file - no data returned',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const uploadedFile = result.data;
    const fileUrl = uploadedFile.url;
    const newFileKey = uploadedFile.key;

    // Optimistic locking: Update DB only if profilePicture hasn't changed
    // This prevents race conditions where concurrent requests could orphan files
    const updateResult = await prisma.user.updateMany({
      where: {
        id: req.user.userId,
        profilePicture: oldProfilePicture, // Only update if it hasn't changed
      },
      data: { profilePicture: fileUrl },
    });

    // If no rows were updated, another request changed the avatar concurrently
    if (updateResult.count === 0) {
      // Delete the newly uploaded file to prevent orphaning
      try {
        await utapi.deleteFiles([newFileKey]);
        logger.warn('Avatar upload conflict - concurrent update detected', {
          userId: req.user.userId,
          deletedFileKey: newFileKey,
        });
      } catch (deleteError) {
        logger.error('Failed to cleanup file after conflict', {
          error: deleteError,
          fileKey: newFileKey,
        });
      }

      throw new ApiError(
        'Avatar was updated by another request. Please try again.',
        HttpStatus.CONFLICT
      );
    }

    // Now it's safe to delete the old profile picture
    if (oldProfilePicture) {
      try {
        // Robust URL parsing to extract file key
        const url = new URL(oldProfilePicture);

        // Validate hostname is from trusted UploadThing domains
        if (!url.hostname.includes('uploadthing') && !url.hostname.includes('utfs.io')) {
          logger.warn(
            'Skipping deletion - profile picture URL is not from trusted UploadThing domain',
            {
              userId: req.user.userId,
              hostname: url.hostname,
            }
          );
        } else {
          // Extract file key from pathname (last segment, ignoring query/search)
          const pathSegments = url.pathname.split('/').filter(Boolean);
          const fileKey = pathSegments[pathSegments.length - 1];

          if (fileKey) {
            await utapi.deleteFiles([fileKey]);
            logger.info('Deleted old profile picture', {
              userId: req.user.userId,
              fileKey,
            });
          }
        }
      } catch (deleteError) {
        // Log error but don't fail the request - file is already replaced in DB
        logger.error('Failed to delete old profile picture', {
          error: deleteError,
          userId: req.user.userId,
        });
      }
    }

    // Fetch the updated user data to return
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePicture: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!updatedUser) {
      throw new ApiError('User not found', HttpStatus.NOT_FOUND);
    }

    logger.info('Avatar uploaded successfully', {
      userId: req.user.userId,
      fileUrl,
    });

    return successResponse({ user: updatedUser }, 'Avatar uploaded successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Avatar upload error', { error, userId: req.user?.userId });
    throw new ApiError('Failed to upload avatar', HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.UPLOAD)
);
