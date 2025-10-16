'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import Link from 'next/link';
import Image from 'next/image';
import { useLogout } from '@/features/auth/api/useAuth';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getNavigationForRole, roleDisplayNames, roleBadgeColors, UserRole } from '@/lib/utils/role-permissions';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const logoutMutation = useLogout();
    const { t } = useTranslation();

    useEffect(() => {
        // Only redirect if auth check is complete (not loading) and user is not authenticated
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Show loading state while redirecting to login
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // Get role-based navigation items
    const allNavItems = useMemo(() => {
        if (!user?.role) return [];
        return getNavigationForRole(user.role as UserRole);
    }, [user?.role]);

    const getInitials = () => {
        if (!user) return '??';
        return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getRoleBadgeColor = (role?: string) => {
        if (!role) return '';
        return roleBadgeColors[role as UserRole] || '';
    };

    const getRoleDisplayName = (role?: string) => {
        if (!role) return 'Unknown';
        return roleDisplayNames[role as UserRole] || role;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className=" flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <Image
                                src="/images/app-logo.png"
                                alt="Patrick Travel Services"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                            <span className="hidden font-bold sm:inline-block text-primary">
                                Patrick Travel Services
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden md:flex flex-col">
                                <span className="text-sm font-medium">
                                    {user?.firstName} {user?.lastName}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium w-fit", getRoleBadgeColor(user?.role))}>
                                    {getRoleDisplayName(user?.role)}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('auth.logout')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)] hidden md:block">
                    <nav className="p-4 space-y-2">
                        {/* Role-Based Navigation */}
                        {allNavItems.map((item) => (
                            <NavLink
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                isActive={pathname === item.href}
                            >
                                {item.title}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavLink({
    href,
    icon: Icon,
    isActive,
    badge,
    children,
}: {
    href: string;
    icon: any;
    isActive?: boolean;
    badge?: number;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'flex items-center justify-between space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
            <div className="flex items-center space-x-3">
                <Icon className="h-4 w-4" />
                <span>{children}</span>
            </div>
            {badge && badge > 0 && (
                <Badge variant="secondary" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {badge}
                </Badge>
            )}
        </Link>
    );
}
