/**
 * Cloudinary Configuration
 * Used for mobile app file uploads
 */

import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/utils/logger';

/**
 * Initialize Cloudinary with environment variables
 */
export function initializeCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn(
      'Cloudinary credentials not configured. Upload functionality will be unavailable.',
      {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      }
    );
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Use HTTPS
    });

    logger.info('Cloudinary initialized successfully', {
      cloudName,
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Cloudinary', error);
    return false;
  }
}

/**
 * Upload file to Cloudinary
 * @param fileBuffer - File buffer or stream
 * @param options - Upload options
 * @returns Upload result with secure URL
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer | Uint8Array,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    allowedFormats?: string[];
    maxFileSize?: number;
  } = {}
) {
  const {
    folder = 'mobile-uploads',
    resourceType = 'auto',
    allowedFormats,
    maxFileSize = 20 * 1024 * 1024, // 20MB default
  } = options;

  // Check file size
  const fileSize = fileBuffer.length;
  if (fileSize > maxFileSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`);
  }

  try {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    // Upload from buffer using upload_stream
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      format: string;
      width?: number;
      height?: number;
      bytes: number;
      created_at: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error('Upload failed: No result returned'));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format || '',
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            created_at: result.created_at || new Date().toISOString(),
          });
        }
      });

      // Write buffer to stream
      uploadStream.end(fileBuffer);
    });

    return result;
  } catch (error) {
    logger.error('Cloudinary upload failed', error);
    throw error;
  }
}

/**
 * Get Cloudinary instance (for advanced operations)
 */
export { cloudinary };

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Initialize on module load (only in server environment)
if (typeof window === 'undefined') {
  initializeCloudinary();
}
