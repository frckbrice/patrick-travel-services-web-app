// File validation utilities for attachments
// Security and performance considerations

export const FILE_VALIDATION = {
  // Maximum file sizes (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB

  // Maximum number of files
  MAX_FILES_PER_MESSAGE: 3,
  MAX_FILES_PER_EMAIL: 3,

  // Allowed file types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],

  // File extensions mapping
  EXTENSIONS: {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
  },
};

export interface FileValidationError {
  file: File;
  error: string;
  code: 'SIZE' | 'TYPE' | 'COUNT';
}

export interface FileValidationResult {
  valid: File[];
  errors: FileValidationError[];
}

/**
 * Validate files for upload
 */
export function validateFiles(
  files: File[],
  existingCount: number = 0,
  maxFiles: number = FILE_VALIDATION.MAX_FILES_PER_MESSAGE
): FileValidationResult {
  const result: FileValidationResult = {
    valid: [],
    errors: [],
  };

  // Check total file count
  if (existingCount + files.length > maxFiles) {
    files.forEach((file) => {
      result.errors.push({
        file,
        error: `Maximum ${maxFiles} files allowed`,
        code: 'COUNT',
      });
    });
    return result;
  }

  // Validate each file
  files.forEach((file) => {
    // Check file type
    const allAllowedTypes = [
      ...FILE_VALIDATION.ALLOWED_IMAGE_TYPES,
      ...FILE_VALIDATION.ALLOWED_DOCUMENT_TYPES,
    ];

    if (!allAllowedTypes.includes(file.type)) {
      result.errors.push({
        file,
        error: `File type "${file.type}" is not allowed`,
        code: 'TYPE',
      });
      return;
    }

    // Check file size
    const maxSize = FILE_VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)
      ? FILE_VALIDATION.MAX_IMAGE_SIZE
      : FILE_VALIDATION.MAX_DOCUMENT_SIZE;

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      result.errors.push({
        file,
        error: `File size exceeds ${maxSizeMB}MB limit`,
        code: 'SIZE',
      });
      return;
    }

    // File is valid
    result.valid.push(file);
  });

  return result;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType === 'text/plain') return '📃';
  return '📎';
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return FILE_VALIDATION.ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/**
 * Sanitize filename to prevent security issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = filename.split('/').pop() || filename;

  // Remove dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
