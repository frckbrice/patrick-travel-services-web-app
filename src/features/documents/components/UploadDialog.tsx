'use client';

import { useState } from 'react';
import { DocumentType } from '../types';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// File validation constants
const MAX_SIZE = 16 * 1024 * 1024; // 16MB in bytes
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const docTypeLabels: Record<DocumentType, string> = {
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

export interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (file: File, documentType: DocumentType, caseId: string) => Promise<void>;
    isUploading: boolean;
}

export function UploadDialog({
    open,
    onOpenChange,
    onUpload,
    isUploading,
}: UploadDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<DocumentType | ''>('');
    const [caseId, setCaseId] = useState<string>('');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            toast.error(`File size exceeds 16MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
            event.target.value = ''; // Reset input
            return;
        }

        // Validate MIME type
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error(`Invalid file type: ${file.type || 'unknown'}. Allowed types: PDF, JPG, PNG, DOC, DOCX.`);
            event.target.value = ''; // Reset input
            return;
        }

        // All validations passed
        setSelectedFile(file);
    };

    const handleUploadClick = async () => {
        if (!selectedFile || !documentType || !caseId) {
            return;
        }

        await onUpload(selectedFile, documentType as DocumentType, caseId);

        // Reset form on successful upload
        setSelectedFile(null);
        setDocumentType('');
        setCaseId('');
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setDocumentType('');
        setCaseId('');
        onOpenChange(false);
    };

    const isFormValid = selectedFile && documentType && caseId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Upload a document for your immigration case
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="document-type">Document Type</Label>
                        <Select
                            value={documentType}
                            onValueChange={(value) => setDocumentType(value as DocumentType)}
                        >
                            <SelectTrigger id="document-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(docTypeLabels).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file-upload">File</Label>
                        <Input
                            id="file-upload"
                            type="file"
                            onChange={handleFileSelect}
                            accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <p className="text-xs text-muted-foreground">
                            Max: 16MB. Supported formats: PDF, JPG, PNG, DOC, DOCX
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="case-id">Case ID (temporary)</Label>
                        <Input
                            id="case-id"
                            placeholder="Enter case ID"
                            value={caseId}
                            onChange={(e) => setCaseId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter your case ID
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadClick}
                        disabled={isUploading || !isFormValid}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

