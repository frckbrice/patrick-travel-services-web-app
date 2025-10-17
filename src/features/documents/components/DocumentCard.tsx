'use client';

import type { Document } from '../types';
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye, Download, Trash2, File, Image, FileIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    PENDING: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    APPROVED: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

const docTypeLabels: Record<string, string> = {
    PASSPORT: 'Passport',
    ID_CARD: 'ID Card',
    BIRTH_CERTIFICATE: 'Birth Certificate',
    MARRIAGE_CERTIFICATE: 'Marriage Certificate',
    DIPLOMA: 'Diploma',
    EMPLOYMENT_LETTER: 'Employment Letter',
    BANK_STATEMENT: 'Bank Statement',
    PROOF_OF_RESIDENCE: 'Proof of Residence',
    PHOTO: 'Photo',
    OTHER: 'Other',
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return File;
    return FileIcon;
};

export interface DocumentCardProps {
    document: Document;
    onView: () => void;
    onDownload: () => void;
    onDelete?: () => void;
    showDelete?: boolean;
    isDeleting?: boolean;
}

export function DocumentCard({
    document,
    onView,
    onDownload,
    onDelete,
    showDelete = false,
    isDeleting = false,
}: DocumentCardProps) {
    const StatusIcon = statusConfig[document.status]?.icon || Clock;
    const FIcon = getFileIcon(document.mimeType);

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between">
                    <div className="flex gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-muted">
                            <FIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex gap-2 mb-1">
                                <h3 className="font-semibold truncate">
                                    {document.originalName}
                                </h3>
                                <Badge
                                    className={cn(
                                        'flex items-center gap-1',
                                        statusConfig[document.status]?.className || ''
                                    )}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig[document.status]?.label || document.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {docTypeLabels[document.documentType] || document.documentType} • {formatFileSize(document.fileSize)} • {new Date(document.uploadDate).toLocaleDateString()}
                            </p>
                            {document.status === 'APPROVED' && document.verifiedBy && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ Verified by {document.verifiedBy}
                                </p>
                            )}
                            {document.status === 'REJECTED' && document.rejectionReason && (
                                <div className="flex gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    <p className="text-xs text-red-600">
                                        {document.rejectionReason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onView}
                            aria-label={`View document: ${document.originalName ?? 'document'}`}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownload}
                            aria-label={`Download document: ${document.originalName ?? 'document'}`}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        {showDelete && onDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDelete}
                                disabled={isDeleting}
                                aria-label={`Delete document: ${document.originalName ?? 'document'}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

