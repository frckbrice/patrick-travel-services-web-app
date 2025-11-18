'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadDropzone } from '@/lib/utils/uploadthing';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface FileUploaderProps {
  endpoint: 'imageUploader' | 'documentUploader' | 'messageAttachment';
  onUploadComplete?: (files: { url: string; name: string }[]) => void;
  onUploadError?: (error: Error) => void;
}

/**
 * File Uploader Component
 * Wrapper around UploadThing dropzone with error handling and notifications
 */
export function FileUploader({ endpoint, onUploadComplete, onUploadError }: FileUploaderProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="w-full">
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          setIsUploading(false);
          const files =
            res?.map((file) => ({
              url: file.ufsUrl,
              name: file.name,
            })) || [];

          toast.success(t('upload.filesUploaded', { count: files.length }));
          logger.info('Files uploaded', { count: files.length, endpoint });

          onUploadComplete?.(files);
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          toast.error(t('upload.uploadFailed', { error: error.message }));
          logger.error('Upload error', { error, endpoint });

          onUploadError?.(error);
        }}
        onUploadBegin={() => {
          setIsUploading(true);
          toast.info(t('upload.uploadingFiles'));
        }}
        config={{
          mode: 'auto',
        }}
        appearance={{
          button:
            'ut-ready:bg-primary ut-uploading:cursor-not-allowed ut-uploading:bg-primary/50 bg-primary hover:bg-primary/90 text-primary-foreground',
          container:
            'w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors',
          allowedContent: 'text-sm text-muted-foreground',
        }}
      />
      {isUploading && (
        <p className="text-sm text-center text-muted-foreground mt-2">
          {t('upload.uploadingPleaseWait')}
        </p>
      )}
    </div>
  );
}
