'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useDocuments, useCreateDocument, useDeleteDocument } from '../api';
import { DocumentType } from '../types';
import type { Document } from '../types';
import { useUploadThing } from '@/lib/uploadthing/client';
import { FileText, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { DocumentCard } from './DocumentCard';
import { UploadDialog } from './UploadDialog';

export function DocumentsList() {
    const { user } = useAuthStore();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [uploadOpen, setUploadOpen] = useState(false);
    
    const { data, isLoading, error, refetch } = useDocuments({});
    const createDocument = useCreateDocument();
    const deleteDocument = useDeleteDocument();
    const { startUpload, isUploading } = useUploadThing("documentUploader");

    const handleUpload = async (selectedFile: File, documentType: DocumentType, caseId: string) => {
        if (!selectedFile || !documentType || !caseId) {
            toast.error('Please select a file, document type, and case');
            logger.warn('Upload validation failed: Missing required fields', {
                hasFile: !!selectedFile,
                hasDocumentType: !!documentType,
                hasCaseId: !!caseId,
            });
            return;
        }

        let uploadedFileUrl: string | null = null;
        let uploadedFileKey: string | null = null;
        let uploadSuccess = false;

        try {
            // Step 1: Upload file to storage
            logger.info('Starting file upload', {
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
                documentType,
                caseId,
            });

            const uploadResult = await startUpload([selectedFile]);
            if (!uploadResult || uploadResult.length === 0) {
                throw new Error('Upload failed: No result returned from storage');
            }

            const uploaded = uploadResult[0];
            uploadedFileUrl = uploaded.url;
            uploadedFileKey = uploaded.key || uploaded.url; // key is used for deletion if available
            uploadSuccess = true;

            logger.info('File upload successful', {
                fileUrl: uploadedFileUrl,
                fileKey: uploadedFileKey,
            });

            // Step 2: Create document metadata in database
            logger.info('Creating document metadata', { fileUrl: uploadedFileUrl });

            await createDocument.mutateAsync({
                fileName: uploaded.name,
                originalName: selectedFile.name,
                filePath: uploaded.url,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
                documentType: documentType as DocumentType,
                caseId,
            });

            logger.info('Document created successfully', { fileUrl: uploadedFileUrl });

            // Step 3: Success - Reset UI state and refetch
            toast.success('Document uploaded successfully');
            setUploadOpen(false);
            refetch();
        } catch (error) {
            // Determine which step failed
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (!uploadSuccess) {
                // Upload to storage failed
                logger.error('File upload failed', error, {
                    fileName: selectedFile.name,
                    fileSize: selectedFile.size,
                });
                toast.error('Upload failed: Could not upload file to storage');
            } else {
                // Document metadata creation failed - attempt rollback
                logger.error('Document metadata creation failed after successful upload', error, {
                    fileUrl: uploadedFileUrl,
                    fileKey: uploadedFileKey,
                });

                // Attempt to delete the uploaded file
                try {
                    logger.info('Attempting rollback: Deleting uploaded file', {
                        fileUrl: uploadedFileUrl,
                        fileKey: uploadedFileKey,
                    });

                    const deleteResponse = await fetch('/api/uploadthing/delete', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ fileKey: uploadedFileKey }),
                    });

                    const deleteResult = await deleteResponse.json();

                    if (deleteResult.success) {
                        logger.info('Rollback successful: Uploaded file deleted', {
                            fileUrl: uploadedFileUrl,
                            fileKey: uploadedFileKey,
                        });
                        toast.error('Upload failed: Could not save document metadata. File has been cleaned up.');
                    } else {
                        logger.warn('Rollback partial failure: File may not have been deleted', {
                            fileUrl: uploadedFileUrl,
                            fileKey: uploadedFileKey,
                            deleteError: deleteResult.error,
                        });
                        toast.error('Upload failed: Could not save document metadata. File may need manual cleanup.');
                    }
                } catch (rollbackError) {
                    logger.error('Rollback failed: Could not delete uploaded file', rollbackError, {
                        fileUrl: uploadedFileUrl,
                        fileKey: uploadedFileKey,
                    });
                    toast.error('Upload failed: Document not saved and file cleanup failed');
                }
            }
        } finally {
        // Shared cleanup: Ensure UI is in consistent state
        // Note: We don't clear the form on error to allow user to retry
        // Only clear on success (which is handled in the try block)
        }
    };

    const handleView = (doc: Document): void => {
        // Validate URL before opening to prevent security issues
        try {
            const url = new URL(doc.filePath);

            // Define trusted domains for file hosting
            const trustedDomains = ['utfs.io', 'uploadthing.com'];

            // Check if the hostname ends with one of the trusted domains
            const isTrustedDomain = trustedDomains.some(domain =>
                url.hostname === domain || url.hostname.endsWith('.' + domain)
            );

            if (!isTrustedDomain) {
                toast.error('Invalid document URL');
                return;
            }

            // Open with security features to prevent window.opener attacks
            window.open(doc.filePath, '_blank', 'noopener,noreferrer');
        } catch (error) {
            toast.error('Invalid document URL');
        }
    };

    const handleDownload = (doc: Document): void => {
        const link = document.createElement('a');
        link.href = doc.filePath;
        link.download = doc.originalName;
        link.click();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        await deleteDocument.mutateAsync(id);
        refetch();
    };
    
    if (isLoading) return <DocumentsListSkeleton />;

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Error loading documents</p>
            </div>
        );
    }

    const documents: Document[] = data?.documents || [];
    const filtered: Document[] = documents.filter((d: Document) =>
        statusFilter === 'all' || d.status === statusFilter
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Documents</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload and manage your documents
                    </p>
                </div>
                <UploadDialog
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    onUpload={handleUpload}
                    isUploading={isUploading}
                />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                        <Button onClick={() => setUploadOpen(true)}>Upload</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((document: Document) => (
                        <DocumentCard
                            key={document.id}
                            document={document}
                            onView={() => handleView(document)}
                            onDownload={() => handleDownload(document)}
                            onDelete={() => handleDelete(document.id)}
                            showDelete={user?.role === 'CLIENT' && document.status !== 'APPROVED'}
                            isDeleting={deleteDocument.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function DocumentsListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-96 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-10 w-48" />
                </CardContent>
            </Card>
            <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <Skeleton className="h-12 w-12" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
