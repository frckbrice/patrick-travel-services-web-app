'use client';

// Enhanced settings view with real theme and language integration

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import {
  Settings,
  Bell,
  Shield,
  Lock,
  Smartphone,
  Globe,
  Palette,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { Input } from '@/components/ui/input';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUserSettings, useUpdateUserSettings, useChangePassword } from '../api/useSettings';
import { logger } from '@/lib/utils/logger';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/firebase-client';

export function SettingsView() {
  const { t } = useTranslation();

  // Fetch user settings from backend
  const { data: settings, isLoading, isError } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const changePassword = useChangePassword();

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Detect if user signed in with OAuth (Google)
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  useEffect(() => {
    const checkAuthProvider = () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Check if user has Google as a provider
      const hasGoogleProvider = currentUser.providerData.some(
        (provider) => provider.providerId === 'google.com'
      );

      // Check if user ONLY has OAuth and no password provider
      const hasPasswordProvider = currentUser.providerData.some(
        (provider) => provider.providerId === 'password'
      );

      setIsOAuthUser(hasGoogleProvider && !hasPasswordProvider);
    };

    checkAuthProvider();
  }, []);

  // Handle notification toggle changes
  const handleNotificationToggle = async (
    key: 'emailNotifications' | 'pushNotifications' | 'smsNotifications',
    value: boolean
  ) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch (error) {
      logger.error('Error updating notification setting', { key, value, error });
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Validation
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error(t('settings.securitySettings.allFieldsRequired'));
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      toast.error(t('settings.securitySettings.passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.new.length < 8) {
      toast.error(t('settings.securitySettings.passwordMinLength'));
      return;
    }

    if (passwordForm.current === passwordForm.new) {
      toast.error(t('settings.securitySettings.passwordMustBeDifferent'));
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(passwordForm.new);
    const hasLowerCase = /[a-z]/.test(passwordForm.new);
    const hasNumber = /[0-9]/.test(passwordForm.new);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error(t('settings.securitySettings.passwordRequirements'));
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });

      // Reset form and close dialog on success
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      setIsPasswordDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation hook
      logger.error('Password change error', { error });
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return <SettingsViewSkeleton />;
  }

  // Show error state
  if (isError || !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{t('settings.loadError')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            {t('settings.appearance.title')}
          </CardTitle>
          <CardDescription>{t('settings.appearance.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.appearance.themeLabel')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.appearance.themeDescription')}
              </p>
            </div>
            <ThemeSwitcher />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.appearance.languageLabel')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.appearance.languageDescription')}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            {t('settings.notificationSettings.title')}
          </CardTitle>
          <CardDescription>{t('settings.notificationSettings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle
            label={t('settings.notificationSettings.emailLabel')}
            description={t('settings.notificationSettings.emailDescription')}
            checked={settings.emailNotifications}
            onCheckedChange={(value) => handleNotificationToggle('emailNotifications', value)}
            disabled={updateSettings.isPending}
          />
          <Separator />
          <SettingToggle
            label={t('settings.notificationSettings.pushLabel')}
            description={t('settings.notificationSettings.pushDescription')}
            checked={settings.pushNotifications}
            onCheckedChange={(value) => handleNotificationToggle('pushNotifications', value)}
            disabled={updateSettings.isPending}
          />
          <Separator />
          <SettingToggle
            label={t('settings.notificationSettings.smsLabel')}
            description={t('settings.notificationSettings.smsDescription')}
            checked={settings.smsNotifications}
            onCheckedChange={(value) => handleNotificationToggle('smsNotifications', value)}
            disabled={updateSettings.isPending}
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            {t('settings.securitySettings.title')}
          </CardTitle>
          <CardDescription>{t('settings.securitySettings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Show different UI for OAuth users vs password users */}
          {isOAuthUser ? (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">
                    {t('settings.securitySettings.oauthPasswordTitle')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.securitySettings.oauthPasswordMessage')}
                  </p>
                  <Button type="button" variant="link" className="h-auto p-0 mt-2 text-sm" asChild>
                    <a
                      href="https://myaccount.google.com/security"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('settings.securitySettings.manageGooglePassword')} →
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start">
                  <Lock className="mr-2 h-4 w-4" />
                  {t('settings.securitySettings.changePassword')}
                </Button>
              </DialogTrigger>
              <DialogContent
                onInteractOutside={(e) => {
                  // Prevent closing dialog when clicking outside while mutation is pending
                  if (changePassword.isPending) {
                    e.preventDefault();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>{t('settings.securitySettings.changePasswordTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('settings.securitySettings.changePasswordDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">
                      {t('settings.securitySettings.currentPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="current"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.current}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, current: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePasswordChange();
                          }
                        }}
                        disabled={changePassword.isPending}
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                        }
                        disabled={changePassword.isPending}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new">{t('settings.securitySettings.newPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="new"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePasswordChange();
                          }
                        }}
                        disabled={changePassword.isPending}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                        }
                        disabled={changePassword.isPending}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.securitySettings.passwordRequirements')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">
                      {t('settings.securitySettings.confirmPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirm}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirm: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePasswordChange();
                          }
                        }}
                        disabled={changePassword.isPending}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                        }
                        disabled={changePassword.isPending}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPasswordForm({ current: '', new: '', confirm: '' });
                      setShowPasswords({ current: false, new: false, confirm: false });
                      setIsPasswordDialogOpen(false);
                    }}
                    disabled={changePassword.isPending}
                  >
                    {t('settings.securitySettings.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={changePassword.isPending}
                  >
                    {changePassword.isPending
                      ? t('settings.securitySettings.updating')
                      : t('settings.securitySettings.updatePassword')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Button variant="outline" className="w-full justify-start">
            <Smartphone className="mr-2 h-4 w-4" />
            {t('settings.securitySettings.twoFactorAuth')}
            <Badge variant="secondary" className="ml-auto">
              {t('settings.securitySettings.comingSoon')}
            </Badge>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <label
        className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
          disabled={disabled}
        />
        <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-600/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
      </label>
    </div>
  );
}

/**
 * PERFORMANCE OPTIMIZED: Reduced from ~55 DOM elements to ~12
 * - Memoized → Better TBT
 * - Reduced from 3 cards to 3 simple blocks → Better Speed Index & FCP
 * - Simplified structure → Better CLS
 */
export const SettingsViewSkeleton = memo(function SettingsViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText size="xl" className="w-32" />
        <SkeletonText size="sm" className="w-96" />
      </div>

      {/* Settings sections - Simplified from nested Card structure to blocks */}
      <SimpleSkeleton className="h-48 w-full rounded-lg" />
      <SimpleSkeleton className="h-48 w-full rounded-lg" />
      <SimpleSkeleton className="h-48 w-full rounded-lg" />
    </div>
  );
});
