// DELETE /api/uploadthing/delete - Delete uploaded files from UploadThing storage
// Used for rollback when document metadata creation fails after successful upload

import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/utils/logger';
import { ERROR_MESSAGES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';

const utapi = new UTApi();

/**
 * Verifies that the requesting user owns the file or has admin privileges
 * @param fileKey - The UploadThing file key
 * @param userId - The requesting user's ID
 * @param userRole - The requesting user's role
 * @returns true if authorized, false otherwise
 */
async function verifyFileOwnership(
  fileKey: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    // Admins can delete any file
    if (userRole === 'ADMIN') {
      return true;
    }

    // Find the document by file path (which contains the fileKey)
    const document = await prisma.document.findFirst({
      where: {
        filePath: {
          contains: fileKey,
        },
      },
      select: {
        uploadedById: true,
      },
    });

    // If document not found in DB, it might be a failed upload - allow deletion for rollback
    if (!document) {
      logger.warn('Document not found in database, allowing deletion for cleanup', {
        fileKey,
        userId,
      });
      return true;
    }

    // Verify the user owns the file
    return document.uploadedById === userId;
  } catch (error) {
    logger.error('Error verifying file ownership', error, { fileKey, userId });
    return false;
  }
}

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

    // Verify file ownership before deletion
    const isAuthorized = await verifyFileOwnership(
      fileKey,
      request.user!.userId,
      request.user!.role
    );

    if (!isAuthorized) {
      logger.warn('Unauthorized file deletion attempt', {
        fileKey,
        userId: request.user?.userId,
        role: request.user?.role,
      });
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN,
        },
        { status: 403 }
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
