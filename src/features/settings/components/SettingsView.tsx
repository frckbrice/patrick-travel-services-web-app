'use client';

import { useTranslation } from 'react-i18next';
import { Settings, Bell, Shield, Lock, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

export function SettingsView() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('settings.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account preferences
                </p>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Bell className="mr-2 h-5 w-5" />
                        {t('settings.general')}
                    </CardTitle>
                    <CardDescription>
                        Configure your notification preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SettingToggle
                        label={t('settings.emailNotifications')}
                        description="Receive email updates about your cases"
                    />
                    <Separator />
                    <SettingToggle
                        label={t('settings.pushNotifications')}
                        description="Get push notifications on mobile"
                    />
                    <Separator />
                    <SettingToggle
                        label={t('settings.smsNotifications')}
                        description="Receive SMS for important updates"
                    />
                </CardContent>
            </Card>

            { }
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Shield className="mr-2 h-5 w-5" />
                        {t('settings.security')}
                    </CardTitle>
                    <CardDescription>
                        Manage your account security and authentication
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                        <Lock className="mr-2 h-4 w-4" />
                        {t('settings.changePassword')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                        <Smartphone className="mr-2 h-4 w-4" />
                        {t('settings.twoFactorAuth')}
                    </Button>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Settings className="mr-2 h-5 w-5" />
                        Preferences
                    </CardTitle>
                    <CardDescription>
                        Customize your application experience
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Language</Label>
                            <p className="text-sm text-muted-foreground">
                                Select your preferred language
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            English
                        </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">
                                Choose your display theme
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            System
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SettingToggle({ label, description }: { label: string; description: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
    );
}
