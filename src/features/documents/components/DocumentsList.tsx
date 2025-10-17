'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useDocuments, useCreateDocument } from '../api';
import { useUploadThing } from '@/lib/uploadthing/client';
import type { Document } from '../types';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DocumentCard } from './DocumentCard';

const docTypeLabels: Record<string, string> = {
    PASSPORT: 'Passport', ID_CARD: 'ID Card', BIRTH_CERTIFICATE: 'Birth Certificate', MARRIAGE_CERTIFICATE: 'Marriage Certificate',
    DIPLOMA: 'Diploma', EMPLOYMENT_LETTER: 'Employment Letter', BANK_STATEMENT: 'Bank Statement', 
    PROOF_OF_RESIDENCE: 'Proof of Residence', PHOTO: 'Photo', OTHER: 'Other',
};

const formatFileSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1024*1024 ? (bytes/1024).toFixed(1) + ' KB' : (bytes/(1024*1024)).toFixed(1) + ' MB';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function DocumentsList() {
    const { user } = useAuthStore();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');
    const [caseId, setCaseId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const { data, isLoading, error: queryError } = useDocuments({});
    const createDocument = useCreateDocument();
    const { startUpload } = useUploadThing('documentUploader');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError('');

        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Validate file size (<=10MB)
        if (file.size > MAX_FILE_SIZE) {
            setError(`File size exceeds 10MB. Please select a smaller file.`);
            setSelectedFile(null);
            e.target.value = '';
            return;
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setError(`Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX`);
            setSelectedFile(null);
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedType || !caseId) {
            setError('Please fill in all required fields');
            return;
        }

        if (error) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Upload file to UploadThing
            const uploadResult = await startUpload([selectedFile]);

            if (!uploadResult || uploadResult.length === 0) {
                throw new Error('File upload failed');
            }

            const uploaded = uploadResult[0];

            // Save document metadata
            await createDocument.mutateAsync({
                fileName: uploaded.name,
                originalName: selectedFile.name,
                filePath: uploaded.url,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
                documentType: selectedType as any,
                caseId,
            });

            // Success feedback
            toast.success('Document uploaded successfully!');

            // Close dialog and reset form
            setUploadOpen(false);
            setSelectedFile(null);
            setSelectedType('');
            setCaseId('');
            setError('');
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Upload failed. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDialogChange = (open: boolean) => {
        setUploadOpen(open);
        if (!open) {
            // Reset form when dialog closes
            setSelectedFile(null);
            setSelectedType('');
            setCaseId('');
            setError('');
        }
    };
    
    if (isLoading) return <DocumentsListSkeleton />;
    if (queryError) return <div className="text-center py-12"><p className="text-red-600">Error loading documents. Please try again.</p></div>;

    const documents: Document[] = data?.documents ?? [];
    const filtered = documents.filter((d: Document) => statusFilter === 'all' || d.status === statusFilter);

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <div><h1 className="text-3xl font-bold">Documents</h1><p className="text-muted-foreground mt-2">Upload and manage your documents</p></div>
                <Dialog open={uploadOpen} onOpenChange={handleDialogChange}>
                    <DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" />Upload</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Upload a new document for your case</DialogDescription></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Document Type</Label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(docTypeLabels).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Case ID</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter case ID"
                                    value={caseId}
                                    onChange={(e) => setCaseId(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Enter the ID of the case this document belongs to</p>
                            </div>
                            <div>
                                <Label>File</Label>
                                <Input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Max: 10MB. Allowed: PDF, JPG, PNG, DOC, DOCX</p>
                                {selectedFile && !error && (
                                    <p className="text-xs text-green-600 mt-1">✓ {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
                                )}
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={loading || !selectedFile || !selectedType || !caseId || !!error}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card><CardContent className="pt-6"><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select></CardContent></Card>
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                        <p className="text-muted-foreground mb-4">
                            {statusFilter !== 'all' ? 'No documents match filter' : 'Upload your first document'}
                        </p>
                        <Button onClick={() => setUploadOpen(true)}>Upload</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((d: Document) => (
                        <DocumentCard
                            key={d.id}
                            document={d}
                            onView={() => {
                                // Validate URL before opening to prevent security issues
                                try {
                                    const url = new URL(d.filePath);
                                    const trustedDomains = ['utfs.io', 'uploadthing.com'];
                                    const isTrustedDomain = trustedDomains.some(domain =>
                                        url.hostname === domain || url.hostname.endsWith('.' + domain)
                                    );
                                    if (!isTrustedDomain) {
                                        toast.error('Invalid document URL');
                                        return;
                                    }
                                    window.open(d.filePath, '_blank', 'noopener,noreferrer');
                                } catch (error) {
                                    toast.error('Invalid document URL');
                                }
                            }}
                            onDownload={() => {
                                // Create download link
                                const link = document.createElement('a');
                                link.href = d.filePath;
                                link.download = d.originalName;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success('Download started');
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function DocumentsListSkeleton() {
    return <div className="space-y-6"><div className="flex justify-between"><div><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-96 mt-2" /></div><Skeleton className="h-10 w-32" /></div><Card><CardContent className="pt-6"><Skeleton className="h-10 w-48" /></CardContent></Card><div className="grid gap-4">{[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><div className="flex gap-4"><Skeleton className="h-12 w-12" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" /></div></div></CardContent></Card>)}</div></div>;
}
