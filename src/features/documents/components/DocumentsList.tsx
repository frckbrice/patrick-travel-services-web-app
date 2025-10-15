'use client';

import { FileUploader } from '@/components/upload/FileUploader';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DocumentsList() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('documents.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    Upload and manage case-related documents
                </p>
            </div>

            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Upload className="mr-2 h-5 w-5" />
                        {t('documents.upload')}
                    </CardTitle>
                    <CardDescription>
                        Upload documents for your immigration cases
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FileUploader
                        endpoint="documentUploader"
                        onUploadComplete={(files) => {
                            console.log('Uploaded files:', files);
                            // TODO: Save metadata to database via API
                        }}
                    />
                </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            {t('documents.myDocuments')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search documents..."
                                    className="pl-8 w-[200px]"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Tabs for filtering */}
                    <Tabs defaultValue="all" className="mb-4">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="passport">Passport</TabsTrigger>
                            <TabsTrigger value="visa">Visa</TabsTrigger>
                            <TabsTrigger value="certificate">Certificates</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Empty State */}
                    <div className="text-center py-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No documents uploaded yet</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Upload your first document above to get started
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
