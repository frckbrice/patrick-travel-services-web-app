'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Loader2,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Trash,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Edit3,
} from 'lucide-react';
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

// Column helper for type safety
const columnHelper = createColumnHelper<DocumentTemplate>();

export function AdminTemplateManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Confirmation dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<string>('all');
  const [category, setCategory] = useState<string>('FORM');
  const [isRequired, setIsRequired] = useState(false);
  const [version, setVersion] = useState('');
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const response = await apiClient.get('/api/templates?includeInactive=true');
      return response.data.data.templates as DocumentTemplate[];
    },
    staleTime: 0, // Always consider data stale to ensure fresh data on mount
    refetchOnMount: true, // Always refetch when component mounts
  });

  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api/templates', data);
      return response.data;
    },
    onMutate: async (newTemplate) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['admin-templates']);

      // Optimistically update with temporary template
      const tempTemplate: DocumentTemplate = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newTemplate.name,
        description: newTemplate.description,
        serviceType: newTemplate.serviceType,
        fileName: newTemplate.fileName,
        fileUrl: newTemplate.fileUrl,
        fileSize: newTemplate.fileSize,
        mimeType: newTemplate.mimeType,
        category: newTemplate.category,
        isRequired: newTemplate.isRequired,
        isActive: true,
        downloadCount: 0,
        version: newTemplate.version,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) => [
        tempTemplate,
        ...old,
      ]);

      return { previousTemplates };
    },
    onSuccess: (data) => {
      // Replace temporary template with real one
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) => {
        const realTemplate = data.data.template;
        return old.map((template) => (template.id.startsWith('temp-') ? realTemplate : template));
      });

      toast.success(t('templates.admin.templateCreated'));
      handleReset();
      setUploadDialogOpen(false);
    },
    onError: (error: any, newTemplate, context) => {
      // Revert optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['admin-templates'], context.previousTemplates);
      }
      toast.error(error.response?.data?.error || t('templates.admin.failedToCreate'));
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/api/templates/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['admin-templates']);

      // Optimistically update the template
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) =>
        old.map((template) =>
          template.id === id
            ? { ...template, ...data, updatedAt: new Date().toISOString() }
            : template
        )
      );

      return { previousTemplates };
    },
    onSuccess: (data) => {
      // Update with the real data from server
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) =>
        old.map((template) =>
          template.id === data.data.template.id ? data.data.template : template
        )
      );

      toast.success(t('templates.admin.templateUpdated'));
      handleReset();
      setEditDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['admin-templates'], context.previousTemplates);
      }
      toast.error(error.response?.data?.error || t('templates.admin.failedToUpdate'));
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/templates/${id}`);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['admin-templates']);

      // Optimistically remove the template
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) =>
        old.filter((template) => template.id !== id)
      );

      return { previousTemplates };
    },
    onSuccess: () => {
      // Don't invalidate queries to preserve pagination state
      // The optimistic update already shows the correct state
      toast.success(t('templates.admin.templateDeleted'));
    },
    onError: (error: any, id, context) => {
      // Revert optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['admin-templates'], context.previousTemplates);
      }
      toast.error(t('templates.admin.failedToDelete'));
    },
  });

  const bulkDeleteTemplates = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => apiClient.delete(`/api/templates/${id}`)));
    },
    onMutate: async (ids) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['admin-templates']);

      // Optimistically remove the templates
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) =>
        old.filter((template) => !ids.includes(template.id))
      );

      return { previousTemplates };
    },
    onSuccess: () => {
      // Don't invalidate queries to preserve pagination state
      // The optimistic update already shows the correct state
      toast.success(t('templates.admin.templatesDeleted'));
      setRowSelection({});
    },
    onError: (error: any, ids, context) => {
      // Revert optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['admin-templates'], context.previousTemplates);
      }
      toast.error(t('templates.admin.failedToDeleteTemplates'));
    },
  });

  const toggleTemplateStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.put(`/api/templates/${id}`, { isActive });
    },
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['admin-templates']);

      // Optimistically update the status
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) =>
        old.map((template) => (template.id === id ? { ...template, isActive } : template))
      );

      return { previousTemplates };
    },
    onSuccess: () => {
      // Don't invalidate queries to preserve pagination state
      // The optimistic update already shows the correct state
      toast.success(t('templates.admin.templateStatusUpdated'));
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['admin-templates'], context.previousTemplates);
      }
      toast.error(t('templates.admin.failedToUpdateStatus'));
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        serviceType: template.serviceType,
        fileUrl: template.fileUrl,
        fileName: template.fileName,
        fileSize: template.fileSize,
        mimeType: template.mimeType,
        category: template.category,
        isRequired: template.isRequired,
        version: template.version,
      };
      const response = await apiClient.post('/api/templates', duplicateData);
      return response.data;
    },
    onMutate: async (template) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['admin-templates']);

      // Optimistically update with temporary duplicate template
      const tempTemplate: DocumentTemplate = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: `${template.name} (Copy)`,
        description: template.description,
        serviceType: template.serviceType,
        fileName: template.fileName,
        fileUrl: template.fileUrl,
        fileSize: template.fileSize,
        mimeType: template.mimeType,
        category: template.category,
        isRequired: template.isRequired,
        isActive: true,
        downloadCount: 0,
        version: template.version,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) => [
        tempTemplate,
        ...old,
      ]);

      return { previousTemplates };
    },
    onSuccess: (data) => {
      // Replace temporary template with real one
      queryClient.setQueryData(['admin-templates'], (old: DocumentTemplate[] = []) => {
        const realTemplate = data.data.template;
        return old.map((template) => (template.id.startsWith('temp-') ? realTemplate : template));
      });

      toast.success(t('templates.admin.templateDuplicated'));
    },
    onError: (error: any, template, context) => {
      // Revert optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['admin-templates'], context.previousTemplates);
      }
      toast.error(t('templates.admin.failedToDuplicate'));
    },
  });

  // Column definitions
  const columns = useMemo<ColumnDef<DocumentTemplate>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('templates.admin.selectAll')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('templates.admin.selectRow')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              {t('templates.admin.name')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <div className="font-medium truncate flex items-center gap-2">
              {row.getValue('name')}
              {row.original.id.startsWith('temp-') && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  {t('templates.admin.creating')}
                </Badge>
              )}
            </div>
            {row.original.isRequired && (
              <Badge variant="destructive" className="mt-1 text-xs">
                {t('templates.required')}
              </Badge>
            )}
            {row.original.version && (
              <div className="text-xs text-muted-foreground mt-1">v{row.original.version}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'serviceType',
        header: t('templates.admin.serviceType'),
        cell: ({ row }) => {
          const serviceType = row.getValue('serviceType') as string;
          return serviceType ? (
            <Badge variant="outline" className="text-xs">
              {serviceType.replace('_', ' ')}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">{t('templates.admin.general')}</span>
          );
        },
        filterFn: (row, id, value) => {
          const serviceType = row.getValue(id) as string;
          return value.includes(serviceType || 'general');
        },
      },
      {
        accessorKey: 'category',
        header: t('templates.admin.category'),
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {row.getValue('category')}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'fileName',
        header: t('templates.admin.file'),
        cell: ({ row }) => {
          const template = row.original;
          return (
            <div className="max-w-[150px]">
              <div className="text-sm font-medium truncate">{template.fileName}</div>
              <div className="text-xs text-muted-foreground">
                {(template.fileSize / 1024).toFixed(0)} KB
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'downloadCount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              {t('templates.admin.downloads')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {row.getValue('downloadCount')}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('templates.admin.status'),
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean;
          const isUpdating =
            toggleTemplateStatus.isPending &&
            toggleTemplateStatus.variables?.id === row.original.id;

          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`text-xs ${isUpdating ? 'opacity-50' : ''}`}
              >
                {isActive ? t('templates.admin.active') : t('templates.admin.inactive')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  toggleTemplateStatus.mutate({
                    id: row.original.id,
                    isActive: !isActive,
                  })
                }
                disabled={toggleTemplateStatus.isPending}
                className="h-6 w-6 p-0"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : isActive ? (
                  <XCircle className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
              </Button>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const isActive = row.getValue(id) as boolean;
          return value.includes(isActive ? 'active' : 'inactive');
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              {t('templates.admin.created')}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'));
          return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>;
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const template = row.original;
          const isDeleting = deleteTemplate.isPending && deleteTemplate.variables === template.id;
          const isDuplicating =
            duplicateTemplate.isPending && duplicateTemplate.variables?.id === template.id;
          const isCreating = template.id.startsWith('temp-');

          return (
            <div className="flex items-center gap-1">
              {/* Edit Action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="h-8 w-8 p-0"
                    disabled={isDeleting || isDuplicating || isCreating}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('templates.admin.editTemplateTooltip')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Duplicate Action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateTemplate.mutate(template)}
                    disabled={duplicateTemplate.isPending || isCreating}
                    className={`h-8 w-8 p-0 ${isDuplicating ? 'opacity-50' : ''}`}
                  >
                    {isDuplicating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-blue-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('templates.admin.duplicateTemplateTooltip')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Download Action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(template.fileUrl || `/templates/${template.fileName}`, '_blank')
                    }
                    className="h-8 w-8 p-0"
                    disabled={isDeleting || isDuplicating || isCreating}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('templates.admin.downloadTemplateTooltip')}</p>
                </TooltipContent>
              </Tooltip>

              {/* View Action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(template.fileUrl || `/templates/${template.fileName}`, '_blank')
                    }
                    className="h-8 w-8 p-0"
                    disabled={isDeleting || isDuplicating || isCreating}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('templates.admin.viewTemplateTooltip')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Delete Action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(template)}
                    disabled={deleteTemplate.isPending || isCreating}
                    className={`h-8 w-8 p-0 ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('templates.admin.deleteTemplateTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [deleteTemplate, toggleTemplateStatus, duplicateTemplate]
  );

  // Table configuration
  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Confirmation handlers
  const handleDeleteClick = (template: DocumentTemplate) => {
    setTemplateToDelete(template);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete.id);
    }
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id);
    bulkDeleteTemplates.mutate(selectedIds);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast.error(t('templates.admin.fileSizeMustBeLessThan'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const headers = await getAuthHeaders();

      // Simulate upload progress (since uploadFiles doesn't provide progress callback)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploaded = await uploadFiles('documentUploader', {
        files: [file],
        headers,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploaded && uploaded[0]) {
        setUploadedFile({
          url: uploaded[0].url,
          name: uploaded[0].name,
          size: uploaded[0].size,
          type: uploaded[0].type,
        });
        toast.success(t('templates.admin.fileUploadedSuccessfully'));
      }
    } catch (error) {
      logger.error('File upload error', error);
      toast.error(t('templates.admin.failedToUploadFile'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setServiceType(template.serviceType || 'all');
    setCategory(template.category);
    setIsRequired(template.isRequired);
    setVersion(template.version || '');
    if (template.fileUrl && !template.fileUrl.startsWith('/templates/')) {
      // If file already exists, show it
      setUploadedFile({
        url: template.fileUrl,
        name: template.fileName,
        size: template.fileSize,
        type: template.mimeType,
      });
    }
    setEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !category) {
      toast.error(t('templates.admin.pleaseFillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);

    try {
      // If editing, use existing file if no new file uploaded
      const fileData = uploadedFile || {
        url: editingTemplate?.fileUrl,
        name: editingTemplate?.fileName,
        size: editingTemplate?.fileSize || 0,
        type: editingTemplate?.mimeType,
      };

      if (editingTemplate) {
        // Update existing template
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          data: {
            name,
            description,
            serviceType: serviceType && serviceType !== 'all' ? serviceType : null,
            fileUrl: fileData.url,
            fileName: fileData.name,
            fileSize: fileData.size,
            mimeType: fileData.type,
            category,
            isRequired,
            version: version || null,
          },
        });
      } else {
        // Create new template
        if (!uploadedFile) {
          toast.error(t('templates.admin.pleaseUploadAFile'));
          return;
        }
        await createTemplate.mutateAsync({
          name,
          description,
          serviceType: serviceType && serviceType !== 'all' ? serviceType : null,
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileSize: fileData.size,
          mimeType: fileData.type,
          category,
          isRequired,
          version: version || null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setServiceType('all');
    setCategory('FORM');
    setIsRequired(false);
    setVersion('');
    setUploadedFile(null);
    setEditingTemplate(null);
  };

  const templates = data || [];
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  // Show skeleton during loading
  if (isLoading) {
    return <AdminTemplateManagerSkeleton />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t('templates.admin.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('templates.admin.description')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-templates'] })}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common.retry')}
            </Button>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('templates.admin.uploadTemplate')}
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Document Templates ({templates.length})</CardTitle>
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{selectedRows.length} selected</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteClick}
                      disabled={bulkDeleteTemplates.isPending}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      {t('templates.admin.deleteSelected')}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Global Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('templates.admin.searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(String(event.target.value))}
                    className="pl-8 w-full sm:w-[300px]"
                  />
                </div>

                {/* Column Visibility */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('templates.admin.noTemplatesYet')}
                </h3>
                <p className="text-muted-foreground mb-4">{t('templates.admin.noTemplatesYet')}</p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('templates.admin.uploadTemplate')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            No results found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{t('templates.admin.rowsPerPage')}</p>
                      <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                          table.setPageSize(Number(value));
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 30, 40, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      {t('templates.admin.page', {
                        current: table.getState().pagination.pageIndex + 1,
                        total: table.getPageCount(),
                      })}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('templates.admin.uploadTemplate')}</DialogTitle>
              <DialogDescription>{t('templates.admin.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">{t('templates.admin.templateName')} *</Label>
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
                      <SelectValue placeholder={t('templates.admin.selectServiceType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">General (All Services)</SelectItem>
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
                  <Label htmlFor="category">{t('templates.admin.category')} *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder={t('templates.admin.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FORM">{t('templates.categories.FORM')}</SelectItem>
                      <SelectItem value="GUIDE">{t('templates.categories.GUIDE')}</SelectItem>
                      <SelectItem value="SAMPLE">{t('templates.categories.SAMPLE')}</SelectItem>
                      <SelectItem value="CHECKLIST">
                        {t('templates.categories.CHECKLIST')}
                      </SelectItem>
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
                    {t('templates.admin.isRequired')}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('templates.admin.uploadFile')} *</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{t('templates.admin.uploading')}</p>
                          <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            {uploadProgress}% complete
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.xlsx"
                          onChange={handleFileUpload}
                          className="max-w-xs mx-auto"
                          disabled={isUploading}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('templates.admin.maxFileSize')}
                        </p>
                      </>
                    )}
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
                {t('templates.admin.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !name ||
                  !uploadedFile ||
                  !category ||
                  createTemplate.isPending ||
                  isUploading ||
                  isSubmitting
                }
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? t('templates.admin.uploading') : t('templates.admin.creating')}
                  </>
                ) : createTemplate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('templates.admin.creating')}
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('templates.admin.uploading')}
                  </>
                ) : (
                  t('templates.admin.uploadTemplate')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('templates.admin.editTemplate')}</DialogTitle>
              <DialogDescription>{t('templates.admin.editTemplate')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-template-name">{t('templates.admin.templateName')} *</Label>
                <Input
                  id="edit-template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Student Visa Application Form"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('templates.admin.templateDescription')}</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this template..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-service-type">Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger id="edit-service-type">
                      <SelectValue placeholder={t('templates.admin.selectServiceType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">General (All Services)</SelectItem>
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
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="edit-category">
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
                  <Label htmlFor="edit-version">Version (optional)</Label>
                  <Input
                    id="edit-version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 2.1"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="edit-is-required"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-is-required" className="cursor-pointer">
                    Required document
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('templates.admin.uploadFile')} (optional)</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{t('templates.admin.uploading')}</p>
                          <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            {uploadProgress}% complete
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.xlsx"
                          onChange={handleFileUpload}
                          className="max-w-xs mx-auto"
                          disabled={isUploading}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('templates.admin.maxFileSize')}
                        </p>
                        {editingTemplate?.fileUrl &&
                          !editingTemplate.fileUrl.startsWith('/templates/') && (
                            <p className="text-xs text-green-600 mt-2">
                              Current file: {editingTemplate.fileName} (will be replaced)
                            </p>
                          )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  handleReset();
                  setEditDialogOpen(false);
                  setEditingTemplate(null);
                }}
                disabled={updateTemplate.isPending}
              >
                {t('templates.admin.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !name || !category || updateTemplate.isPending || isUploading || isSubmitting
                }
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? t('templates.admin.uploading') : t('templates.admin.updating')}
                  </>
                ) : updateTemplate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('templates.admin.updating')}
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('templates.admin.uploading')}
                  </>
                ) : (
                  t('templates.admin.update')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={handleConfirmDelete}
          title={t('templates.admin.deleteTemplate')}
          description={`${t('templates.admin.deleteConfirm')} "${templateToDelete?.name}"? ${t('templates.admin.thisActionCannotBeUndone')}`}
          confirmText={t('templates.admin.deleteTemplate')}
          cancelText={t('templates.admin.cancel')}
          variant="destructive"
          isLoading={deleteTemplate.isPending}
        />

        <ConfirmationDialog
          open={bulkDeleteConfirmOpen}
          onOpenChange={setBulkDeleteConfirmOpen}
          onConfirm={handleConfirmBulkDelete}
          title={t('templates.admin.bulkDelete')}
          description={`${t('templates.admin.deleteConfirmMultiple', { count: table.getFilteredSelectedRowModel().rows.length })} ${t('templates.admin.thisActionCannotBeUndone')}`}
          confirmText={t('templates.admin.deleteSelected')}
          cancelText={t('templates.admin.cancel')}
          variant="destructive"
          isLoading={bulkDeleteTemplates.isPending}
        />
      </div>
    </TooltipProvider>
  );
}

/**
 * AdminTemplateManagerSkeleton - Skeleton loader that matches the exact table structure
 * Performance optimized with SimpleSkeleton and proper column widths
 */
export function AdminTemplateManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <SimpleSkeleton className="h-9 w-64" />
          <SimpleSkeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="flex gap-2">
          <SimpleSkeleton className="h-10 w-24" />
          <SimpleSkeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Filters and Controls Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <SimpleSkeleton className="h-6 w-48" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Search skeleton */}
              <SimpleSkeleton className="h-10 w-full sm:w-[300px]" />
              {/* Column visibility skeleton */}
              <SimpleSkeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Skeleton */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Select column */}
                    <TableHead className="w-12">
                      <SimpleSkeleton className="h-4 w-4" />
                    </TableHead>
                    {/* Name column */}
                    <TableHead className="w-[200px]">
                      <SimpleSkeleton className="h-4 w-16" />
                    </TableHead>
                    {/* Service Type column */}
                    <TableHead className="w-[120px]">
                      <SimpleSkeleton className="h-4 w-24" />
                    </TableHead>
                    {/* Category column */}
                    <TableHead className="w-[100px]">
                      <SimpleSkeleton className="h-4 w-20" />
                    </TableHead>
                    {/* File column */}
                    <TableHead className="w-[150px]">
                      <SimpleSkeleton className="h-4 w-12" />
                    </TableHead>
                    {/* Downloads column */}
                    <TableHead className="w-[100px]">
                      <SimpleSkeleton className="h-4 w-20" />
                    </TableHead>
                    {/* Status column */}
                    <TableHead className="w-[120px]">
                      <SimpleSkeleton className="h-4 w-16" />
                    </TableHead>
                    {/* Created column */}
                    <TableHead className="w-[120px]">
                      <SimpleSkeleton className="h-4 w-16" />
                    </TableHead>
                    {/* Actions column */}
                    <TableHead className="w-[200px]">
                      <SimpleSkeleton className="h-4 w-16" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {/* Select cell */}
                      <TableCell>
                        <SimpleSkeleton className="h-4 w-4" />
                      </TableCell>
                      {/* Name cell */}
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="space-y-2">
                            <SimpleSkeleton className="h-4 w-32" />
                            <SimpleSkeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </TableCell>
                      {/* Service Type cell */}
                      <TableCell>
                        <SimpleSkeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      {/* Category cell */}
                      <TableCell>
                        <SimpleSkeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      {/* File cell */}
                      <TableCell>
                        <div className="max-w-[150px]">
                          <SimpleSkeleton className="h-4 w-24" />
                          <SimpleSkeleton className="h-3 w-16 mt-1" />
                        </div>
                      </TableCell>
                      {/* Downloads cell */}
                      <TableCell>
                        <div className="text-center">
                          <SimpleSkeleton className="h-5 w-8 rounded-full mx-auto" />
                        </div>
                      </TableCell>
                      {/* Status cell */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SimpleSkeleton className="h-5 w-16 rounded-full" />
                          <SimpleSkeleton className="h-6 w-6 rounded" />
                        </div>
                      </TableCell>
                      {/* Created cell */}
                      <TableCell>
                        <SimpleSkeleton className="h-4 w-20" />
                      </TableCell>
                      {/* Actions cell */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SimpleSkeleton className="h-8 w-8 rounded" />
                          <SimpleSkeleton className="h-8 w-8 rounded" />
                          <SimpleSkeleton className="h-8 w-8 rounded" />
                          <SimpleSkeleton className="h-8 w-8 rounded" />
                          <SimpleSkeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <SimpleSkeleton className="h-4 w-20" />
                  <SimpleSkeleton className="h-8 w-[70px]" />
                </div>
                <SimpleSkeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center space-x-2">
                <SimpleSkeleton className="h-8 w-8 rounded" />
                <SimpleSkeleton className="h-8 w-8 rounded" />
                <SimpleSkeleton className="h-8 w-8 rounded" />
                <SimpleSkeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
