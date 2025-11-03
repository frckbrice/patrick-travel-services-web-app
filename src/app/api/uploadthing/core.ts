import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';

const f = createUploadthing();

/**
 * Authentication function for UploadThing
 * Tries multiple sources: Authorization header, cookies, or custom header
 * Based on UploadThing docs: https://docs.uploadthing.com/api-reference/server#onuploaderror
 */
const auth = async (req: Request) => {
  // Try to get token from multiple sources
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Log for debugging (logger only logs in development)
  logger.debug('[UploadThing Auth] Has Authorization header:', { hasHeader: !!authHeader });
  logger.debug('[UploadThing Auth] Has admin auth:', { hasAdminAuth: !!adminAuth });

  if (!adminAuth) {
    logger.error('[UploadThing Auth] Firebase Admin not initialized!');
    throw new Error('Authentication service unavailable');
  }

  if (!token) {
    logger.error('[UploadThing Auth] No token found in request');
    throw new Error('Unauthorized: No authentication token provided');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    logger.debug('[UploadThing Auth] Token verified for user:', { uid: decodedToken.uid });
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
    };
  } catch (error) {
    logger.error('[UploadThing Auth] Token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
};

/**
 * UploadThing File Router
 * Define file upload endpoints with authentication and validation
 */
export const ourFileRouter = {
  // Image uploader for profile pictures, case images, etc.
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      return { userId: user.uid, uploadedBy: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      logger.info('Image upload complete for user:', { userId: metadata.userId });
      logger.info('File URL:', { fileUrl: file.ufsUrl });

      // Return data to client
      return {
        uploadedBy: metadata.uploadedBy,
        fileUrl: file.ufsUrl,
        fileName: file.name,
      };
    }),

  // Document uploader for case documents (PDFs, images, etc.)
  documentUploader: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    'application/msword': { maxFileSize: '16MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '16MB',
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      return { userId: user.uid, uploadedBy: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      logger.info('Document upload complete for user:', { userId: metadata.userId });
      logger.info('File URL:', { fileUrl: file.ufsUrl });

      // Document metadata should be saved via /api/documents POST endpoint
      // This keeps the upload logic separate from metadata storage
      // Client should call /api/documents after upload with:
      // {
      //     fileName: file.name,
      //     originalName: file.name,
      //     filePath: file.ufsUrl,
      //     fileSize: file.size,
      //     mimeType: file.type,
      //     documentType: 'TYPE',
      //     caseId: 'case-id'
      // }

      return {
        uploadedBy: metadata.uploadedBy,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        fileSize: file.size,
      };
    }),

  // Message attachment uploader (for chat)
  messageAttachment: f({
    image: { maxFileSize: '4MB', maxFileCount: 3 },
    pdf: { maxFileSize: '8MB', maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      return { userId: user.uid, uploadedBy: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      logger.info('Message attachment uploaded by:', { userId: metadata.userId });

      return {
        uploadedBy: metadata.uploadedBy,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        fileSize: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
