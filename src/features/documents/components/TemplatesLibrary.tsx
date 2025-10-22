'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, FileCheck, ListChecks, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { logger } from '@/lib/utils/logger';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  serviceType?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  isRequired: boolean;
  downloadCount: number;
  version?: string;
  fileUrl?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'FORM':
      return FileText;
    case 'GUIDE':
      return BookOpen;
    case 'SAMPLE':
      return FileCheck;
    case 'CHECKLIST':
      return ListChecks;
    default:
      return FileText;
  }
};

export function TemplatesLibrary() {
  const { t } = useTranslation();
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['templates', serviceFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceFilter && serviceFilter !== 'all') {
        params.append('serviceType', serviceFilter);
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await apiClient.get(`/api/templates?${params}`);
      return response.data.data.templates as DocumentTemplate[];
    },
  });

  const templates = data || [];

  const handleDownload = async (template: DocumentTemplate) => {
    setDownloadingId(template.id);

    try {
      // Track download
      await apiClient.get(`/api/templates/${template.id}`);

      // Download file
      const link = document.createElement('a');
      link.href = template.fileUrl || `/templates/${template.fileName}`;
      link.download = template.fileName;
      link.click();

      toast.success(t('templates.downloaded') || 'Template downloaded');
      logger.info('Template downloaded', { templateId: template.id });
    } catch (error) {
      toast.error(t('templates.downloadFailed') || 'Failed to download template');
      logger.error('Template download error', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const getServiceTypeLabel = (serviceType: string): string => {
    const labels: Record<string, string> = {
      STUDENT_VISA: t('cases.serviceTypes.STUDENT_VISA') || 'Student Visa',
      WORK_PERMIT: t('cases.serviceTypes.WORK_PERMIT') || 'Work Permit',
      FAMILY_REUNIFICATION: t('cases.serviceTypes.FAMILY_REUNIFICATION') || 'Family Reunification',
      TOURIST_VISA: t('cases.serviceTypes.TOURIST_VISA') || 'Tourist Visa',
      BUSINESS_VISA: t('cases.serviceTypes.BUSINESS_VISA') || 'Business Visa',
      PERMANENT_RESIDENCY: t('cases.serviceTypes.PERMANENT_RESIDENCY') || 'Permanent Residency',
    };
    return labels[serviceType] || serviceType;
  };

  // Group templates by service type
  const groupedTemplates = templates.reduce(
    (acc, template) => {
      const key = template.serviceType || 'GENERAL';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(template);
      return acc;
    },
    {} as Record<string, DocumentTemplate[]>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SimpleSkeleton className="h-16 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <SimpleSkeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('templates.filterByService') || 'All Services'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('templates.allServices') || 'All Services'}</SelectItem>
                <SelectItem value="STUDENT_VISA">
                  {t('cases.serviceTypes.STUDENT_VISA') || 'Student Visa'}
                </SelectItem>
                <SelectItem value="WORK_PERMIT">
                  {t('cases.serviceTypes.WORK_PERMIT') || 'Work Permit'}
                </SelectItem>
                <SelectItem value="FAMILY_REUNIFICATION">
                  {t('cases.serviceTypes.FAMILY_REUNIFICATION') || 'Family Reunification'}
                </SelectItem>
                <SelectItem value="TOURIST_VISA">
                  {t('cases.serviceTypes.TOURIST_VISA') || 'Tourist Visa'}
                </SelectItem>
                <SelectItem value="BUSINESS_VISA">
                  {t('cases.serviceTypes.BUSINESS_VISA') || 'Business Visa'}
                </SelectItem>
                <SelectItem value="PERMANENT_RESIDENCY">
                  {t('cases.serviceTypes.PERMANENT_RESIDENCY') || 'Permanent Residency'}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('templates.filterByCategory') || 'All Categories'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('templates.allCategories') || 'All Categories'}
                </SelectItem>
                <SelectItem value="FORM">{t('templates.categories.FORM') || 'Forms'}</SelectItem>
                <SelectItem value="GUIDE">{t('templates.categories.GUIDE') || 'Guides'}</SelectItem>
                <SelectItem value="SAMPLE">
                  {t('templates.categories.SAMPLE') || 'Samples'}
                </SelectItem>
                <SelectItem value="CHECKLIST">
                  {t('templates.categories.CHECKLIST') || 'Checklists'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates grouped by service type */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('templates.noTemplates') || 'No Templates Available'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('templates.noTemplatesDescription') ||
                'Templates will appear here once added by administrators'}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTemplates).map(([serviceType, serviceTemplates]) => (
          <Card key={serviceType}>
            <CardHeader>
              <CardTitle>
                {serviceType === 'GENERAL'
                  ? t('templates.generalTemplates') || 'General Templates'
                  : getServiceTypeLabel(serviceType)}
              </CardTitle>
              <CardDescription>
                {serviceTemplates.length} {serviceTemplates.length === 1 ? 'template' : 'templates'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {serviceTemplates.map((template) => {
                  const Icon = getCategoryIcon(template.category);
                  const isDownloading = downloadingId === template.id;

                  return (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">
                              {template.name}
                              {template.isRequired && (
                                <span className="ml-2 text-xs text-destructive">
                                  * {t('templates.required') || 'Required'}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {template.category} • {(template.fileSize / 1024).toFixed(0)} KB
                              {template.version && ` • v${template.version}`}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {template.description}
                        </p>
                        <Button
                          onClick={() => handleDownload(template)}
                          disabled={isDownloading}
                          className="w-full"
                          size="sm"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t('templates.downloading') || 'Downloading...'}
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              {t('templates.download') || 'Download'}
                            </>
                          )}
                        </Button>
                        {template.downloadCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            {template.downloadCount}{' '}
                            {template.downloadCount === 1 ? 'download' : 'downloads'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
