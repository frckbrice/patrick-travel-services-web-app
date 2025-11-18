'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/utils/axios';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Shield, Users, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { InviteCodesTable } from './InviteCodesTable';
import { SimpleSkeleton } from '@/components/ui/simple-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface InviteCode {
  id: string;
  code: string;
  role: 'AGENT' | 'ADMIN';
  createdById: string;
  lastUsedById: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export function InviteCodeManagerEnhanced() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [role, setRole] = useState<'AGENT' | 'ADMIN'>('AGENT');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);

  // Session awareness: Only ADMIN can access
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Copy to clipboard helper
  const copyToClipboard = (code: string) => {
    if (!navigator.clipboard) {
      toast.error(t('inviteCodes.clipboardNotAvailable'));
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(t('inviteCodes.copiedToClipboard')))
      .catch(() => toast.error(t('inviteCodes.copyFailed')));
  };

  // Generate invite code mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ data: { inviteCode: InviteCode } }>(
        ROUTES.API.ADMIN.INVITE_CODES,
        {
          role,
          expiresInDays,
          maxUses,
        }
      );
      return response.data.data.inviteCode;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['invite-codes-table'] });

      // Snapshot the previous value
      const previousInviteCodes = queryClient.getQueryData(['invite-codes-table']);

      // Optimistically update with temporary invite code
      const tempInviteCode: InviteCode = {
        id: `temp-${Date.now()}`, // Temporary ID
        code: t('inviteCodes.generating'),
        role,
        createdById: user?.id || '',
        lastUsedById: null,
        maxUses,
        usedCount: 0,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      };

      // Add to the beginning of the list
      queryClient.setQueryData(['invite-codes-table'], (old: any) => {
        if (!old) return { inviteCodes: [tempInviteCode], pagination: { total: 1 } };
        return {
          ...old,
          inviteCodes: [tempInviteCode, ...old.inviteCodes],
          pagination: { ...old.pagination, total: old.pagination.total + 1 },
        };
      });

      return { previousInviteCodes };
    },
    onSuccess: (data) => {
      // Replace temporary invite code with real one
      queryClient.setQueryData(['invite-codes-table'], (old: any) => {
        if (!old) return { inviteCodes: [data], pagination: { total: 1 } };
        return {
          ...old,
          inviteCodes: old.inviteCodes.map((code: InviteCode) =>
            code.id.startsWith('temp-') ? data : code
          ),
        };
      });

      toast.success(
        t('inviteCodes.codeGenerated', { role: t(`users.${data.role.toLowerCase()}`) })
      );
      setIsDialogOpen(false);

      // Auto-copy to clipboard
      copyToClipboard(data.code);

      // Reset form
      setRole('AGENT');
      setExpiresInDays(7);
      setMaxUses(1);
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousInviteCodes) {
        queryClient.setQueryData(['invite-codes-table'], context.previousInviteCodes);
      }
      toast.error(
        t('inviteCodes.generateError', { error: error.response?.data?.error || error.message })
      );
    },
  });

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <Key className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <span className="break-words">{t('inviteCodes.management')}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base leading-relaxed">
            {t('inviteCodes.description')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('inviteCodes.generateCode')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {t('inviteCodes.generateDialog.title')}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {t('inviteCodes.generateDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm sm:text-base font-medium">
                  {t('inviteCodes.generateDialog.roleLabel')}
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'AGENT' | 'ADMIN')}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder={t('inviteCodes.generateDialog.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t('users.agent')}
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t('users.admin')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresInDays" className="text-sm sm:text-base font-medium">
                  {t('inviteCodes.generateDialog.expiryLabel')}
                </Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min={1}
                  max={365}
                  value={expiresInDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 365) {
                      setExpiresInDays(val);
                    }
                  }}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Between 1 and 365 {t('inviteCodes.generateDialog.days')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-sm sm:text-base font-medium">
                  {t('inviteCodes.generateDialog.maxUsesLabel')}
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setMaxUses(val);
                    }
                  }}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t('inviteCodes.maxUsesHelper')}
                </p>
              </div>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full text-sm sm:text-base"
            >
              {generateMutation.isPending
                ? t('inviteCodes.generateDialog.generating')
                : t('inviteCodes.generateDialog.generate')}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <InviteCodesTable />
    </div>
  );
}

/**
 * InviteCodeManagerSkeleton - Skeleton loader that matches the exact structure
 * Performance optimized with SimpleSkeleton
 */
export function InviteCodeManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <SimpleSkeleton className="h-9 w-64" />
          <SimpleSkeleton className="h-5 w-96 mt-2" />
        </div>
        <SimpleSkeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <SimpleSkeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <SimpleSkeleton className="h-10 w-32" />
              <SimpleSkeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="overflow-hidden">
              {/* Table Header Skeleton */}
              <div className="border-b bg-muted/50">
                <div className="flex items-center px-4 py-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Table Rows Skeleton */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-b last:border-b-0">
                  <div className="flex items-center px-4 py-3">
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-24" />
                    </div>
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-12" />
                    </div>
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-16" />
                    </div>
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-20" />
                    </div>
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-16" />
                    </div>
                    <div className="flex-1 px-2">
                      <SimpleSkeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <SimpleSkeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <SimpleSkeleton className="h-9 w-24" />
          <SimpleSkeleton className="h-4 w-20" />
          <SimpleSkeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
