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
import { useState } from 'react';
import { toast } from 'sonner';

export function SettingsView() {
    const { t } = useTranslation();
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account preferences and settings
                </p>
            </div>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Palette className="mr-2 h-5 w-5" />
                        Appearance
                    </CardTitle>
                    <CardDescription>
                        Customize how the application looks
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">
                                Choose your display theme (light, dark, or system)
                            </p>
                        </div>
                        <ThemeSwitcher />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Language</Label>
                            <p className="text-sm text-muted-foreground">
                                Select your preferred language
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
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Configure how you receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SettingToggle
                        label="Email Notifications"
                        description="Receive email updates about your cases"
                        checked={emailNotif}
                        onCheckedChange={setEmailNotif}
                    />
                    <Separator />
                    <SettingToggle
                        label="Push Notifications"
                        description="Get push notifications in your browser"
                        checked={pushNotif}
                        onCheckedChange={setPushNotif}
                    />
                    <Separator />
                    <SettingToggle
                        label="SMS Notifications"
                        description="Receive SMS for critical updates"
                        checked={smsNotif}
                        onCheckedChange={setSmsNotif}
                    />
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Shield className="mr-2 h-5 w-5" />
                        Security
                    </CardTitle>
                    <CardDescription>
                        Manage your account security and authentication
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <Lock className="mr-2 h-4 w-4" />
                                Change Password
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription>
                                    Update your password to keep your account secure
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current">Current Password</Label>
                                    <Input id="current" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new">New Password</Label>
                                    <Input id="new" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">Confirm New Password</Label>
                                    <Input id="confirm" type="password" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button onClick={() => toast.success('Password updated successfully!')}>
                                    Update Password
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="w-full justify-start">
                        <Smartphone className="mr-2 h-4 w-4" />
                        Two-Factor Authentication
                        <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
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
    onCheckedChange 
}: { 
    label: string; 
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={checked}
                    onChange={(e) => onCheckedChange(e.target.checked)}
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

