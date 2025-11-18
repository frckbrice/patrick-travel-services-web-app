'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HelpCircle, Plus, FileText, Shield } from 'lucide-react';
import {
  LegalDocument,
  useLegalDocuments,
  useCreateLegal,
  useUpdateLegal,
  useDeleteLegal,
} from '@/features/legal/api';

type LegalTab = 'TERMS' | 'PRIVACY';

export function LegalManagement() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LegalTab>('TERMS');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    version: '',
    content: '',
    language: 'en',
    isActive: true,
    publishedAt: '' as string | '',
  });

  // Fetch all documents (no language filter for admin view)
  const { data, isLoading, error } = useLegalDocuments(activeTab, { includeInactive: true });
  const createMutation = useCreateLegal(activeTab);
  const updateMutation = useUpdateLegal(activeTab);
  const deleteMutation = useDeleteLegal(activeTab);

  if (user?.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{t('legal.management.accessDenied')}</h3>
          <p className="text-muted-foreground">{t('legal.management.onlyAdministrators')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <LegalManagementSkeleton />;
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{t('legal.management.failedToLoad')}</h3>
          <p className="text-muted-foreground">{t('legal.management.tryRefreshing')}</p>
        </CardContent>
      </Card>
    );
  }

  const documents = data?.documents || [];

  const handleCreate = () => {
    createMutation.mutate(
      {
        title: formData.title,
        slug: formData.slug,
        version: formData.version || undefined,
        content: formData.content,
        language: formData.language,
        isActive: formData.isActive,
        publishedAt: formData.publishedAt || undefined,
      },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setFormData({
            title: '',
            slug: '',
            version: '',
            content: '',
            language: 'en',
            isActive: true,
            publishedAt: '',
          });
        },
      }
    );
  };

  const handleEdit = () => {
    if (!selectedDoc) return;
    updateMutation.mutate(
      {
        id: selectedDoc.id,
        title: formData.title,
        slug: formData.slug,
        version: formData.version || undefined,
        content: formData.content,
        language: formData.language,
        isActive: formData.isActive,
        publishedAt: formData.publishedAt || undefined,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedDoc(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedDoc) return;
    deleteMutation.mutate(selectedDoc.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedDoc(null);
      },
    });
  };

  const openEditDialog = (doc: LegalDocument) => {
    setSelectedDoc(doc);
    setFormData({
      title: doc.title,
      slug: doc.slug,
      version: doc.version || '',
      content: doc.content,
      language: doc.language,
      isActive: doc.isActive,
      publishedAt: doc.publishedAt || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (doc: LegalDocument) => {
    setSelectedDoc(doc);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('legal.management.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('legal.management.description')}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('legal.management.addDocument')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalTab)}>
        <TabsList>
          <TabsTrigger value="TERMS">
            <FileText className="h-4 w-4 mr-2" /> {t('legal.management.terms')}
          </TabsTrigger>
          <TabsTrigger value="PRIVACY">
            <Shield className="h-4 w-4 mr-2" /> {t('legal.management.privacy')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                {t('legal.management.documents')} ({documents.length})
              </CardDescription>
              <CardTitle className="text-3xl">
                {activeTab === 'TERMS'
                  ? t('legal.management.termsDocuments')
                  : t('legal.management.privacyDocuments')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">{t('legal.management.table.title')}</th>
                      <th className="py-2 pr-4">{t('legal.management.table.language')}</th>
                      <th className="py-2 pr-4">{t('legal.management.table.slug')}</th>
                      <th className="py-2 pr-4">{t('legal.management.table.version')}</th>
                      <th className="py-2 pr-4">{t('legal.management.table.active')}</th>
                      <th className="py-2 pr-4">{t('legal.management.table.published')}</th>
                      <th className="py-2 pr-4">{t('legal.management.table.updated')}</th>
                      <th className="py-2 pr-4 text-right">
                        {t('legal.management.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-muted/40">
                        <td className="py-2 pr-4 font-medium">{doc.title}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {doc.language.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{doc.slug}</td>
                        <td className="py-2 pr-4">{doc.version || '-'}</td>
                        <td className="py-2 pr-4">
                          {doc.isActive ? t('legal.management.yes') : t('legal.management.no')}
                        </td>
                        <td className="py-2 pr-4">
                          {doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-2 pr-4">{new Date(doc.updatedAt).toLocaleString()}</td>
                        <td className="py-2 pr-0 text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(doc)}>
                            {t('legal.management.edit')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(doc)}
                          >
                            {t('legal.management.delete')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr>
                        <td className="py-8 text-center text-muted-foreground" colSpan={8}>
                          {t('legal.management.noDocuments')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('legal.management.create.title')}</DialogTitle>
            <DialogDescription>{t('legal.management.create.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('legal.management.form.title')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">{t('legal.management.form.language')}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('legal.management.languages.en')}</SelectItem>
                    <SelectItem value="fr">{t('legal.management.languages.fr')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="slug">{t('legal.management.form.slug')}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder={t('legal.management.form.slugPlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="version">{t('legal.management.form.version')}</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder={t('legal.management.form.versionPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="content">{t('legal.management.form.content')}</Label>
              <Textarea
                id="content"
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">{t('legal.management.form.active')}</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div>
                <Label htmlFor="publishedAt">{t('legal.management.form.publishedAt')}</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('legal.management.form.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !formData.title ||
                !formData.slug ||
                !formData.content ||
                !formData.language
              }
            >
              {createMutation.isPending
                ? t('legal.management.create.creating')
                : t('legal.management.create.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('legal.management.edit.title')}</DialogTitle>
            <DialogDescription>{t('legal.management.edit.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t('legal.management.form.title')}</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-language">{t('legal.management.form.language')}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('legal.management.languages.en')}</SelectItem>
                    <SelectItem value="fr">{t('legal.management.languages.fr')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-slug">{t('legal.management.form.slug')}</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-version">{t('legal.management.form.version')}</Label>
              <Input
                id="edit-version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">{t('legal.management.form.content')}</Label>
              <Textarea
                id="edit-content"
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isActive">{t('legal.management.form.active')}</Label>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div>
                <Label htmlFor="edit-publishedAt">{t('legal.management.form.publishedAt')}</Label>
                <Input
                  id="edit-publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('legal.management.form.cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                updateMutation.isPending ||
                !formData.title ||
                !formData.slug ||
                !formData.content ||
                !formData.language
              }
            >
              {updateMutation.isPending
                ? t('legal.management.edit.updating')
                : t('legal.management.edit.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t('legal.management.delete.title')}
        description={t('legal.management.delete.description', { title: selectedDoc?.title || '' })}
        confirmText={t('legal.management.delete.button')}
        cancelText={t('legal.management.form.cancel')}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function LegalManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
