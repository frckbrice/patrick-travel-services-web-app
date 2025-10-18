'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/utils/logger';
import { uploadFiles, getAuthHeaders } from '@/lib/uploadthing/client';

interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    serviceType?: string;
    fileName: string;
    fileUrl?: string;
    fileSize: number;
    mimeType: string;
    category: string;
    isRequired: boolean;
    isActive: boolean;
    downloadCount: number;
    version?: string;
    createdAt: string;
}

export function AdminTemplateManager() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [serviceType, setServiceType] = useState<string>('');
    const [category, setCategory] = useState<string>('FORM');
    const [isRequired, setIsRequired] = useState(false);
    const [version, setVersion] = useState('');
    const [uploadedFile, setUploadedFile] = useState<any>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-templates'],
        queryFn: async () => {
            const response = await apiClient.get('/api/templates');
            return response.data.data.templates as DocumentTemplate[];
        },
    });

    const createTemplate = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post('/api/templates', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Template created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
            handleReset();
            setUploadDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create template');
        },
    });

    const deleteTemplate = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/templates/${id}`);
        },
        onSuccess: () => {
            toast.success('Template deleted');
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
        },
        onError: () => {
            toast.error('Failed to delete template');
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 16MB)
        if (file.size > 16 * 1024 * 1024) {
            toast.error('File size must be less than 16MB');
            return;
        }

        setIsUploading(true);
        try {
            const headers = await getAuthHeaders();
            const uploaded = await uploadFiles('documentUploader', {
                files: [file],
                headers,
            });

            if (uploaded && uploaded[0]) {
                setUploadedFile({
                    url: uploaded[0].url,
                    name: uploaded[0].name,
                    size: uploaded[0].size,
                    type: uploaded[0].type,
                });
                toast.success('File uploaded successfully');
            }
        } catch (error) {
            logger.error('File upload error', error);
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !uploadedFile || !category) {
            toast.error('Please fill all required fields and upload a file');
            return;
        }

        await createTemplate.mutateAsync({
            name,
            description,
            serviceType: serviceType || null,
            fileUrl: uploadedFile.url,
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            mimeType: uploadedFile.type,
            category,
            isRequired,
            version: version || null,
        });
    };

    const handleReset = () => {
        setName('');
        setDescription('');
        setServiceType('');
        setCategory('FORM');
        setIsRequired(false);
        setVersion('');
        setUploadedFile(null);
    };

    const templates = data || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Template Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage downloadable forms and guides for clients
                    </p>
                </div>
                <Button onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Document Templates ({templates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                            <Button onClick={() => setUploadDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Upload First Template
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Service Type</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>File</TableHead>
                                    <TableHead>Downloads</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{template.name}</p>
                                                {template.isRequired && (
                                                    <Badge variant="destructive" className="mt-1">Required</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {template.serviceType ? (
                                                <Badge variant="outline">
                                                    {template.serviceType.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">General</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{template.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{template.fileName}</p>
                                                <p className="text-muted-foreground">
                                                    {(template.fileSize / 1024).toFixed(0)} KB
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{template.downloadCount}</TableCell>
                                        <TableCell>
                                            {template.isActive ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => window.open(template.fileUrl || `/templates/${template.fileName}`, '_blank')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteTemplate.mutate(template.id)}
                                                    disabled={deleteTemplate.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Template</DialogTitle>
                        <DialogDescription>
                            Upload a form, guide, or checklist for clients to download
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name *</Label>
                            <Input
                                id="template-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Student Visa Application Form"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of this template..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="service-type">Service Type</Label>
                                <Select value={serviceType} onValueChange={setServiceType}>
                                    <SelectTrigger id="service-type">
                                        <SelectValue placeholder="Select service (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">General (All Services)</SelectItem>
                                        <SelectItem value="STUDENT_VISA">Student Visa</SelectItem>
                                        <SelectItem value="WORK_PERMIT">Work Permit</SelectItem>
                                        <SelectItem value="FAMILY_REUNIFICATION">Family Reunification</SelectItem>
                                        <SelectItem value="TOURIST_VISA">Tourist Visa</SelectItem>
                                        <SelectItem value="BUSINESS_VISA">Business Visa</SelectItem>
                                        <SelectItem value="PERMANENT_RESIDENCY">Permanent Residency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FORM">Form</SelectItem>
                                        <SelectItem value="GUIDE">Guide</SelectItem>
                                        <SelectItem value="SAMPLE">Sample</SelectItem>
                                        <SelectItem value="CHECKLIST">Checklist</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version (optional)</Label>
                                <Input
                                    id="version"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="e.g., 2.1"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-8">
                                <input
                                    type="checkbox"
                                    id="is-required"
                                    checked={isRequired}
                                    onChange={(e) => setIsRequired(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="is-required" className="cursor-pointer">
                                    Required document
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Upload File *</Label>
                            {uploadedFile ? (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(uploadedFile.size / 1024).toFixed(0)} KB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setUploadedFile(null)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xlsx"
                                        onChange={handleFileUpload}
                                        className="max-w-xs mx-auto"
                                        disabled={isUploading}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        PDF, DOC, DOCX, XLSX • Max 16MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                handleReset();
                                setUploadDialogOpen(false);
                            }}
                            disabled={createTemplate.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!name || !uploadedFile || !category || createTemplate.isPending || isUploading}
                        >
                            {createTemplate.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Template'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

