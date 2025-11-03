// Attachment Preview Component - Display attachments in messages
// Supports images, documents with download functionality

'use client';

import { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, File, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, isImage } from '@/lib/utils/file-validation';
import { cn } from '@/lib/utils';
import type { MessageAttachment } from '@/lib/types';

interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  onRemove?: () => void;
  removable?: boolean;
  className?: string;
}

export function AttachmentPreview({
  attachment,
  onRemove,
  removable = false,
  className,
}: AttachmentPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isImageFile = isImage(attachment.type);
  const canPreview = isImageFile && !imageError;

  const handleDownload = () => {
    // Open in new tab (secure download)
    window.open(attachment.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
        className
      )}
    >
      {/* Thumbnail or Icon */}
      <div className="flex-shrink-0">
        {canPreview ? (
          <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
            )}
            <img
              src={attachment.url}
              alt={attachment.name}
              className={cn('w-full h-full object-cover', !imageLoaded && 'opacity-0')}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
            {attachment.type.includes('pdf') ? (
              <FileText className="h-6 w-6 text-red-600" />
            ) : attachment.type.includes('word') ? (
              <FileText className="h-6 w-6 text-blue-600" />
            ) : attachment.type.includes('excel') || attachment.type.includes('spreadsheet') ? (
              <FileText className="h-6 w-6 text-green-600" />
            ) : (
              <File className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Download Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
          title="Download file"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Remove Button (only if removable) */}
        {removable && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
            onClick={onRemove}
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* View Button (always visible for files) */}
        {!removable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="View file"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface AttachmentListProps {
  attachments: MessageAttachment[];
  onRemove?: (index: number) => void;
  removable?: boolean;
  className?: string;
}

export function AttachmentList({
  attachments,
  onRemove,
  removable = false,
  className,
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {attachments.map((attachment, index) => (
        <AttachmentPreview
          key={`${attachment.url}-${index}`}
          attachment={attachment}
          onRemove={onRemove ? () => onRemove(index) : undefined}
          removable={removable}
        />
      ))}
    </div>
  );
}
