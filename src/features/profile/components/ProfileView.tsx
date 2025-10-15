'use client';

import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export function ProfileView() {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    const getInitials = () => {
        if (!user) return '??';
        return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getRoleBadgeVariant = (role?: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'ADMIN': 'destructive',
            'AGENT': 'default',
            'CLIENT': 'secondary',
        };
        return variants[role || ''] || 'outline';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('profile.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your personal information
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card>
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle>
                            {user?.firstName} {user?.lastName}
                        </CardTitle>
                        <CardDescription className="flex items-center justify-center mt-2">
                            <Mail className="h-3 w-3 mr-1" />
                            {user?.email}
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                        <div className="flex justify-center">
                            <Badge variant={getRoleBadgeVariant(user?.role)}>
                                <Shield className="h-3 w-3 mr-1" />
                                {user?.role}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Details */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('profile.personalInfo')}</CardTitle>
                        <CardDescription>
                            Your account details and information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ProfileField
                            icon={User}
                            label={t('auth.firstName')}
                            value={user?.firstName || ''}
                        />
                        <ProfileField
                            icon={User}
                            label={t('auth.lastName')}
                            value={user?.lastName || ''}
                        />
                        <ProfileField
                            icon={Mail}
                            label={t('auth.email')}
                            value={user?.email || ''}
                        />
                        <ProfileField
                            icon={Phone}
                            label={t('auth.phone')}
                            value={user?.phone || 'Not provided'}
                        />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <ProfileStatusBadge
                                label={t('profile.accountStatus')}
                                value={user?.isActive ? 'Active' : 'Inactive'}
                                isActive={user?.isActive}
                            />
                            <ProfileStatusBadge
                                label={t('profile.emailVerified')}
                                value={user?.isVerified ? 'Verified' : 'Not Verified'}
                                isActive={user?.isVerified}
                            />
                        </div>
                    </CardContent>
                    <Separator />
                    <CardContent className="pt-6">
                        <Button>
                            {t('profile.editProfile')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ProfileField({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

function ProfileStatusBadge({
    label,
    value,
    isActive,
}: {
    label: string;
    value: string;
    isActive?: boolean;
}) {
    return (
        <div className="flex flex-col space-y-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Badge variant={isActive ? 'default' : 'secondary'} className="w-fit">
                {isActive ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                )}
                {value}
            </Badge>
        </div>
    );
}
