'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useDocuments, useCreateDocument, useDeleteDocument } from '../api';
import { useUploadThing } from '@/lib/uploadthing/client';
import { FileText, Upload, Download, Eye, Trash2, CheckCircle2, XCircle, Clock, AlertCircle, File, Image as ImageIcon, FileIcon, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    PENDING: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    APPROVED: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

const docTypeLabels: Record<string, string> = {
    PASSPORT: 'Passport', ID_CARD: 'ID Card', BIRTH_CERTIFICATE: 'Birth Certificate', MARRIAGE_CERTIFICATE: 'Marriage Certificate',
    DIPLOMA: 'Diploma', EMPLOYMENT_LETTER: 'Employment Letter', BANK_STATEMENT: 'Bank Statement', 
    PROOF_OF_RESIDENCE: 'Proof of Residence', PHOTO: 'Photo', OTHER: 'Other',
};

const formatFileSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1024*1024 ? (bytes/1024).toFixed(1) + ' KB' : (bytes/(1024*1024)).toFixed(1) + ' MB';
const getFileIcon = (mimeType: string) => mimeType.startsWith('image/') ? ImageIcon : mimeType === 'application/pdf' ? File : FileIcon;

export function DocumentsList() {
    const { user } = useAuthStore();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<string>('');
    const [caseId, setCaseId] = useState<string>('');
    
    const { data, isLoading, error, refetch } = useDocuments({});
    const createDocument = useCreateDocument();
    const deleteDocument = useDeleteDocument();
    const { startUpload, isUploading } = useUploadThing("documentUploader");

    const handleUpload = async () => {
        if (!selectedFile || !documentType || !caseId) {
            toast.error('Please select a file, document type, and case');
            return;
        }

        try {
            const uploadResult = await startUpload([selectedFile]);
            if (!uploadResult || uploadResult.length === 0) {
                throw new Error('Upload failed');
            }

            const uploaded = uploadResult[0];
            await createDocument.mutateAsync({
                fileName: uploaded.name,
                originalName: selectedFile.name,
                filePath: uploaded.url,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
                documentType,
                caseId,
            });

            setUploadOpen(false);
            setSelectedFile(null);
            setDocumentType('');
            refetch();
        } catch (error) {
            toast.error('Upload failed. Please try again.');
        }
    };

    const handleView = (doc: any) => {
        window.open(doc.filePath, '_blank');
    };

    const handleDownload = (doc: any) => {
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
    if (error) return <div className="text-center py-12"><p className="text-red-600">Error loading documents</p></div>;

    const documents = data?.documents || [];
    const filtered = documents.filter((d: any) => statusFilter === 'all' || d.status === statusFilter);

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <div><h1 className="text-3xl font-bold">Documents</h1><p className="text-muted-foreground mt-2">Upload and manage your documents</p></div>
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" />Upload</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Upload a document for your immigration case</DialogDescription></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div><Label>Document Type</Label><Select value={documentType} onValueChange={setDocumentType}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{Object.entries(docTypeLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>File</Label><Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /><p className="text-xs text-muted-foreground">Max: 16MB. PDF, JPG, PNG, DOC</p></div>
                            <div><Label>Case ID (temp)</Label><Input placeholder="Case ID" value={caseId} onChange={(e) => setCaseId(e.target.value)} /><p className="text-xs text-muted-foreground">Enter your case ID</p></div>
                        </div>
                        <DialogFooter><Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button onClick={handleUpload} disabled={isUploading || !selectedFile || !documentType || !caseId}>{isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : 'Upload'}</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card><CardContent className="pt-6"><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select></CardContent></Card>
            {filtered.length === 0 ? <Card><CardContent className="py-12 text-center"><FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">No Documents</h3><Button onClick={() => setUploadOpen(true)}>Upload</Button></CardContent></Card> : <div className="grid gap-4">{filtered.map((d: any) => { const StatusIcon = statusConfig[d.status]?.icon || Clock; const FIcon = getFileIcon(d.mimeType); return (<Card key={d.id}><CardContent className="pt-6"><div className="flex justify-between"><div className="flex gap-4 flex-1"><div className="p-3 rounded-lg bg-muted"><FIcon className="h-6 w-6 text-primary" /></div><div className="flex-1"><div className="flex gap-2 mb-1"><h3 className="font-semibold truncate">{d.originalName}</h3><Badge className={cn('flex items-center gap-1', statusConfig[d.status]?.className || '')}><StatusIcon className="h-3 w-3" />{statusConfig[d.status]?.label || d.status}</Badge></div><p className="text-sm text-muted-foreground">{docTypeLabels[d.documentType] || d.documentType} • {formatFileSize(d.fileSize)} • {new Date(d.uploadDate).toLocaleDateString()}</p>{d.status === 'APPROVED' && d.verifiedBy && <p className="text-xs text-green-600">✓ Verified by {d.verifiedBy}</p>}{d.status === 'REJECTED' && d.rejectionReason && <div className="flex gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded"><AlertCircle className="h-4 w-4 text-red-600" /><p className="text-xs text-red-600">{d.rejectionReason}</p></div>}</div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleView(d)}><Eye className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => handleDownload(d)}><Download className="h-4 w-4" /></Button>{user?.role === 'CLIENT' && d.status !== 'APPROVED' && <Button variant="outline" size="sm" onClick={() => handleDelete(d.id)} disabled={deleteDocument.isPending}><Trash2 className="h-4 w-4" /></Button>}</div></div></CardContent></Card>);})}</div>}
        </div>
    );
}

export function DocumentsListSkeleton() {
    return <div className="space-y-6"><div className="flex justify-between"><div><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-96 mt-2" /></div><Skeleton className="h-10 w-32" /></div><Card><CardContent className="pt-6"><Skeleton className="h-10 w-48" /></CardContent></Card><div className="grid gap-4">{[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><div className="flex gap-4"><Skeleton className="h-12 w-12" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" /></div></div></CardContent></Card>)}</div></div>;
}
