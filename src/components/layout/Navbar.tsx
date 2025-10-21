'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuthStore } from '@/features/auth/store';

// PERFORMANCE: Memoized Navbar component
export const Navbar = memo(function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  // PERFORMANCE: Direct access to avoid memoization dependency issues
  const navigation = [
    { nameKey: 'landing.footer.services', href: '/#services' },
    { nameKey: 'landing.testimonials.title', href: '/#testimonials' },
    { nameKey: 'landing.contact.title', href: '/#contact' },
    { nameKey: 'landing.footer.about', href: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          {/* PERFORMANCE: Priority loading for logo (above the fold) */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg bg-white dark:bg-white p-1.5 flex items-center justify-center">
            <Image
              src="/images/app-logo.png"
              alt="Patrick Travel Service"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-primary text-xl hidden sm:inline-block">
            Patrick Travel Service
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.nameKey}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <span suppressHydrationWarning>{t(item.nameKey)}</span>
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          {/* SESSION AWARE: Show different buttons based on auth status */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span suppressHydrationWarning>{t('common.dashboard') || 'Dashboard'}</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <span suppressHydrationWarning>{t('auth.login')}</span>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <span suppressHydrationWarning>{t('auth.signUp')}</span>
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.nameKey}
                href={item.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span suppressHydrationWarning>{t(item.nameKey)}</span>
              </Link>
            ))}
            <div className="flex items-center space-x-2 pt-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            {/* SESSION AWARE: Show different buttons for mobile */}
            <div className="flex flex-col space-y-2 pt-2">
              {isAuthenticated ? (
                <Button className="w-full" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span suppressHydrationWarning>{t('common.dashboard') || 'Dashboard'}</span>
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">
                      <span suppressHydrationWarning>{t('auth.login')}</span>
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/register">
                      <span suppressHydrationWarning>{t('auth.signUp')}</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
});
