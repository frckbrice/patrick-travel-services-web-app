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
      toast.error('Clipboard API not available');
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(t('inviteCodes.copiedToClipboard')))
      .catch(() => toast.error('Failed to copy to clipboard'));
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
    onSuccess: (data) => {
      toast.success(`${data.role} invite code generated!`);
      setIsDialogOpen(false);

      // Invalidate all invite-codes queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ['invite-codes-table'] });

      // Auto-copy to clipboard
      copyToClipboard(data.code);

      // Reset form
      setRole('AGENT');
      setExpiresInDays(7);
      setMaxUses(1);
    },
    onError: (error: any) => {
      toast.error(
        `Failed to generate invite code: ${error.response?.data?.error || error.message}`
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-8 w-8 text-primary" />
            {t('inviteCodes.management')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('inviteCodes.description')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('inviteCodes.generateCode')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('inviteCodes.generateDialog.title')}</DialogTitle>
              <DialogDescription>{t('inviteCodes.generateDialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t('inviteCodes.generateDialog.roleLabel')}</Label>
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
                <Label htmlFor="expiresInDays">{t('inviteCodes.generateDialog.expiryLabel')}</Label>
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
                />
                <p className="text-xs text-muted-foreground">
                  Between 1 and 365 {t('inviteCodes.generateDialog.days')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">{t('inviteCodes.generateDialog.maxUsesLabel')}</Label>
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
                />
                <p className="text-xs text-muted-foreground">Between 1 and 100 uses</p>
              </div>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full"
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
