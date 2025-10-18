'use client';

import { ReactNode, useEffect, useMemo, memo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import Link from 'next/link';
import Image from 'next/image';
import { useLogout } from '@/features/auth/api/useAuth';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  Loader2,
  Menu,
  User,
  Settings as SettingsIcon,
  ChevronDown,
  LayoutDashboard,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getNavigationForRole,
  roleDisplayNames,
  roleBadgeColors,
  UserRole,
} from '@/lib/utils/role-permissions';
import { useRealtimeNotifications } from '@/features/notifications/hooks/useRealtimeNotifications';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const logoutMutation = useLogout();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get role-based navigation items (must be called before any early returns)
  const allNavItems = useMemo(() => {
    if (!user?.role) return [];
    return getNavigationForRole(user.role as UserRole);
  }, [user?.role]);

  useEffect(() => {
    // Only redirect if auth check is complete (not loading) and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Real-time notifications
  useRealtimeNotifications();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
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
          <p className="mt-4 text-muted-foreground">{t('dashboard.redirectingToLogin')}</p>
        </div>
      </div>
    );
  }

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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <SheetHeader>
                    <SheetTitle className="text-left">{t('dashboard.navigation')}</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    {allNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                          pathname === item.href
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </nav>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 px-4">
                      <LanguageSwitcher />
                      <ThemeSwitcher />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/images/app-logo.png"
                  alt={t('common.appName')}
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
                <span className="hidden font-bold sm:inline-block text-primary">
                  {t('common.appName')}
                </span>
              </Link>
            </div>

            {/* Right Section - Theme, Language & User Info */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Theme & Language Switchers */}
              <div className="hidden sm:flex items-center space-x-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              {/* User Profile Dropdown - Shows only initials */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-1">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <Badge className={cn('w-fit mt-1', getRoleBadgeColor(user?.role))}>
                        {getRoleDisplayName(user?.role)}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      <span>{t('dashboard.goBackToSite')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('profile.title')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>{t('settings.title')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>{t('auth.loggingOut')}</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('auth.logout')}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="w-full max-w-7xl mx-auto">
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

// PERFORMANCE: Memoize NavLink to prevent unnecessary re-renders
const NavLink = memo(function NavLink({
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
        <Badge
          variant="secondary"
          className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {badge}
        </Badge>
      )}
    </Link>
  );
});
