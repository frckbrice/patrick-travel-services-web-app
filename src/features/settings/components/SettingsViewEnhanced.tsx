'use client';

// Enhanced settings view with real theme and language integration

import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Settings, Bell, Shield, Lock, Smartphone, Globe, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUserSettings, useUpdateUserSettings, useChangePassword } from '../api/useSettings';
import { logger } from '@/lib/utils/logger';
import { useState } from 'react';

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
        confirm: ''
    });
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    // Handle notification toggle changes
    const handleNotificationToggle = async (key: 'emailNotifications' | 'pushNotifications' | 'smsNotifications', value: boolean) => {
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
            toast.error('All password fields are required');
            return;
        }

        if (passwordForm.new !== passwordForm.confirm) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.new.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (passwordForm.current === passwordForm.new) {
            toast.error('New password must be different from current password');
            return;
        }

        // Password strength validation
        const hasUpperCase = /[A-Z]/.test(passwordForm.new);
        const hasLowerCase = /[a-z]/.test(passwordForm.new);
        const hasNumber = /[0-9]/.test(passwordForm.new);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            toast.error('Password must contain uppercase, lowercase, and numbers');
            return;
        }

        try {
            await changePassword.mutateAsync({
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new,
            });

            // Reset form and close dialog on success
            setPasswordForm({ current: '', new: '', confirm: '' });
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
                        <p className="text-destructive">Failed to load settings. Please try refreshing the page.</p>
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
                <p className="text-muted-foreground mt-2">
                    {t('settings.subtitle')}
                </p>
            </div>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Palette className="mr-2 h-5 w-5" />
                        {t('settings.appearance.title')}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.appearance.description')}
                    </CardDescription>
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
                    <CardDescription>
                        {t('settings.notificationSettings.description')}
                    </CardDescription>
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
                    <CardDescription>
                        {t('settings.securitySettings.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <Lock className="mr-2 h-4 w-4" />
                                {t('settings.securitySettings.changePassword')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('settings.securitySettings.changePasswordTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('settings.securitySettings.changePasswordDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current">{t('settings.securitySettings.currentPassword')}</Label>
                                    <Input
                                        id="current"
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                        disabled={changePassword.isPending}
                                        autoComplete="current-password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new">{t('settings.securitySettings.newPassword')}</Label>
                                    <Input
                                        id="new"
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                        disabled={changePassword.isPending}
                                        autoComplete="new-password"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 8 characters with uppercase, lowercase, and numbers
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">{t('settings.securitySettings.confirmPassword')}</Label>
                                    <Input
                                        id="confirm"
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                        disabled={changePassword.isPending}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPasswordForm({ current: '', new: '', confirm: '' });
                                        setIsPasswordDialogOpen(false);
                                    }}
                                    disabled={changePassword.isPending}
                                >
                                    {t('settings.securitySettings.cancel')}
                                </Button>
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={changePassword.isPending}
                                >
                                    {changePassword.isPending ? 'Updating...' : t('settings.securitySettings.updatePassword')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="w-full justify-start">
                        <Smartphone className="mr-2 h-4 w-4" />
                        {t('settings.securitySettings.twoFactorAuth')}
                        <Badge variant="secondary" className="ml-auto">{t('settings.securitySettings.comingSoon')}</Badge>
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
    disabled = false
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
            <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={checked}
                    onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
                    disabled={disabled}
                />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
    );
}

export function SettingsViewSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1,2].map(i => (
                        <div key={i} className="flex justify-between py-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-6 w-11 rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            {[1,2].map(i => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1,2,3].map(j => (
                            <Skeleton key={j} className="h-10 w-full" />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

