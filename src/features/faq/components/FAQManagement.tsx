'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useFAQs,
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
  FAQ,
  CreateFAQInput,
} from '@/features/faq/api';
import { useAuthStore } from '@/features/auth/store';
import { HelpCircle, Plus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Switch } from '@/components/ui/switch';
import { FAQTableEnhanced } from './FAQTableEnhanced';

const CATEGORIES = [
  'Visa Process',
  'Documents',
  'Payment',
  'Account',
  'General',
  'Technical Support',
];

const LANGUAGE_OPTIONS = ['en', 'fr'] as const;

export function FAQManagement() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'fr'>('all');

  // Form state
  const [formData, setFormData] = useState<CreateFAQInput>({
    question: '',
    answer: '',
    category: 'General',
    order: 0,
    isActive: true,
    language: 'en',
  });

  // Fetch FAQs (including inactive for admin view)
  const { data, isLoading, error } = useFAQs({
    includeInactive: true,
    language: languageFilter === 'all' ? undefined : languageFilter,
  });
  const createMutation = useCreateFAQ();
  const updateMutation = useUpdateFAQ();
  const deleteMutation = useDeleteFAQ();

  const getCategoryLabel = (category: string) => {
    const slug = category
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const translated = t(`faq.section.categoryLabels.${slug}`);
    return translated.startsWith('faq.section.categoryLabels.') ? category : translated;
  };

  const getLanguageLabel = (value: 'en' | 'fr' | 'all') => {
    if (value === 'all') {
      return t('faq.managementPage.languageAll');
    }
    return t(`faq.managementPage.languageOptions.${value}`);
  };

  // Only ADMIN can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {t('faq.managementPage.accessDenied.title')}
          </h3>
          <p className="text-muted-foreground">
            {t('faq.managementPage.accessDenied.description')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <FAQManagementSkeleton />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{t('faq.managementPage.loadError.title')}</h3>
          <p className="text-muted-foreground">{t('faq.managementPage.loadError.description')}</p>
        </CardContent>
      </Card>
    );
  }

  const faqs = data?.faqs || [];
  const categories = data?.categories || [];

  const handleCreate = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFormData({
          question: '',
          answer: '',
          category: 'General',
          order: 0,
          isActive: true,
          language: formData.language ?? 'en',
        });
      },
    });
  };

  const handleEdit = () => {
    if (!selectedFAQ) return;
    updateMutation.mutate(
      { id: selectedFAQ.id, ...formData },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedFAQ(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedFAQ) return;
    deleteMutation.mutate(selectedFAQ.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedFAQ(null);
      },
    });
  };

  const openEditDialog = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive,
      language: faq.language || 'en',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('faq.managementPage.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('faq.managementPage.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('faq.managementPage.languageLabel')}
            </span>
            <Select
              value={languageFilter}
              onValueChange={(value: 'all' | 'en' | 'fr') => setLanguageFilter(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getLanguageLabel('all')}</SelectItem>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getLanguageLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('faq.managementPage.addButton')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('faq.managementPage.stats.total')}</CardDescription>
            <CardTitle className="text-3xl">{faqs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('faq.managementPage.stats.active')}</CardDescription>
            <CardTitle className="text-3xl">{faqs.filter((f) => f.isActive).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('faq.managementPage.stats.categories')}</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Enhanced Table with TanStack */}
      <FAQTableEnhanced
        data={faqs}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        categories={categories}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('faq.managementPage.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('faq.managementPage.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">{t('faq.managementPage.form.questionLabel')}</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder={t('faq.managementPage.form.questionPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="answer">{t('faq.managementPage.form.answerLabel')}</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder={t('faq.managementPage.form.answerPlaceholder')}
                rows={6}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="category">{t('faq.managementPage.form.categoryLabel')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">{t('faq.managementPage.form.languageLabel')}</Label>
                <Select
                  value={formData.language || 'en'}
                  onValueChange={(value: 'en' | 'fr') =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {getLanguageLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order">{t('faq.managementPage.form.orderLabel')}</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">{t('faq.managementPage.form.activeLabel')}</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !formData.question || !formData.answer}
            >
              {createMutation.isPending
                ? t('faq.managementPage.createDialog.submitting')
                : t('faq.managementPage.createDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('faq.managementPage.editDialog.title')}</DialogTitle>
            <DialogDescription>{t('faq.managementPage.editDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-question">{t('faq.managementPage.form.questionLabel')}</Label>
              <Input
                id="edit-question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-answer">{t('faq.managementPage.form.answerLabel')}</Label>
              <Textarea
                id="edit-answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={6}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="edit-category">{t('faq.managementPage.form.categoryLabel')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-language">{t('faq.managementPage.form.languageLabel')}</Label>
                <Select
                  value={formData.language || 'en'}
                  onValueChange={(value: 'en' | 'fr') =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {getLanguageLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-order">{t('faq.managementPage.form.orderLabel')}</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">{t('faq.managementPage.form.activeLabel')}</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateMutation.isPending || !formData.question || !formData.answer}
            >
              {updateMutation.isPending
                ? t('faq.managementPage.editDialog.submitting')
                : t('faq.managementPage.editDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t('faq.managementPage.deleteDialog.title')}
        description={t('faq.managementPage.deleteDialog.description', {
          question: selectedFAQ?.question ?? '',
        })}
        confirmText={t('faq.managementPage.deleteDialog.confirm')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function FAQManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
