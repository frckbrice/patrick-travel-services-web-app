// DELETE /api/uploadthing/delete - Delete uploaded files from UploadThing storage
// Used for rollback when document metadata creation fails after successful upload

import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/utils/logger';
import { ERROR_MESSAGES } from '@/lib/constants';

const utapi = new UTApi();

async function handler(request: AuthenticatedRequest) {
    try {
        const body = await request.json();
        const { fileKey } = body;

        if (!fileKey) {
            logger.warn('File deletion failed: Missing fileKey', { userId: request.user?.userId });
            return NextResponse.json(
                {
                    success: false,
                    error: 'File key is required',
                },
                { status: 400 }
            );
        }

        logger.info('Attempting to delete file from UploadThing', {
            fileKey,
            userId: request.user?.userId,
        });

        // Delete the file from UploadThing storage
        const result = await utapi.deleteFiles(fileKey);

        if (result.success) {
            logger.info('File deleted successfully from UploadThing', {
                fileKey,
                userId: request.user?.userId,
            });

            return NextResponse.json(
                {
                    success: true,
                    message: 'File deleted successfully',
                },
                { status: 200 }
            );
        } else {
            logger.error('File deletion failed', result, {
                fileKey,
                userId: request.user?.userId,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to delete file from storage',
                },
                { status: 500 }
            );
        }
    } catch (error) {
        logger.error('Error deleting file from UploadThing', error, {
            userId: request.user?.userId,
        });

        return NextResponse.json(
            {
                success: false,
                error: ERROR_MESSAGES.SERVER_ERROR,
            },
            { status: 500 }
        );
    }
}

export const DELETE = authenticateToken(handler);

