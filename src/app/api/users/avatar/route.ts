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

        // Validate file size (4MB max)
        const maxSize = 4 * 1024 * 1024; // 4MB
        if (file.size > maxSize) {
            throw new ApiError('Image size must be less than 4MB', HttpStatus.BAD_REQUEST);
        }

        // Get current user to check if they have an existing profile picture
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { profilePicture: true },
        });

        // Delete old profile picture from UploadThing if it exists
        if (currentUser?.profilePicture) {
            try {
                // Extract file key from URL (e.g., https://uploadthing.com/f/abc123 -> abc123)
                const urlParts = currentUser.profilePicture.split('/');
                const fileKey = urlParts[urlParts.length - 1];
                if (fileKey) {
                    await utapi.deleteFiles([fileKey]);
                    logger.info('Deleted old profile picture', {
                        userId: req.user.userId,
                        fileKey
                    });
                }
            } catch (deleteError) {
                // Log error but don't fail the request
                logger.error('Failed to delete old profile picture', {
                    error: deleteError,
                    userId: req.user.userId
                });
            }
        }

        // Upload the new file to UploadThing
        const uploadResponse = await utapi.uploadFiles([file]);

        if (!uploadResponse || uploadResponse.length === 0 || !uploadResponse[0].data) {
            throw new ApiError('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const uploadedFile = uploadResponse[0].data;
        const fileUrl = uploadedFile.url;

        // Update user's profile picture in database
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { profilePicture: fileUrl },
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

        logger.info('Avatar uploaded successfully', {
            userId: req.user.userId,
            fileUrl
        });

        return successResponse({ user: updatedUser }, 'Avatar uploaded successfully');
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        logger.error('Avatar upload error', { error, userId: req.user?.userId });
        throw new ApiError(
            'Failed to upload avatar',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
});

export const POST = withCorsMiddleware(
    withRateLimit(authenticateToken(handler), RateLimitPresets.UPLOAD)
);

