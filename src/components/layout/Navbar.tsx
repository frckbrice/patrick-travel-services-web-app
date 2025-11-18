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
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-transparent dark:border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {/* PERFORMANCE: Priority loading for logo (above the fold) */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-lg bg-white/60 dark:bg-white p-1.5 flex items-center justify-center overflow-hidden">
              <Image
                src="/images/app-logo.png"
                alt="Patrick Travel Service"
                width={40}
                height={40}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
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
                className="text-md font-medium text-muted-foreground hover:text-primary transition-colors"
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
          <div className="md:hidden border-t border-transparent dark:border-transparent">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
              {/* Company Name - Mobile Only */}
              <div className="pb-2 border-b border-border/50">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Image
                    src="/images/app-logo.png"
                    alt="Patrick Travel Services"
                    width={32}
                    height={32}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <span className="font-bold text-lg text-primary">Patrick Travel Services</span>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    className="block py-2.5 px-3 text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span suppressHydrationWarning>{t(item.nameKey)}</span>
                  </Link>
                ))}
              </div>

              {/* Language and Theme Switchers */}
              <div className="pt-2 pb-2 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2 px-1">
                      {t('settings.language') || 'Language'}
                    </span>
                    <div className="flex justify-start">
                      <LanguageSwitcher />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2 px-1">
                      {t('settings.theme') || 'Theme'}
                    </span>
                    <div className="flex justify-start">
                      <ThemeSwitcher />
                    </div>
                  </div>
                </div>
              </div>

              {/* SESSION AWARE: Show different buttons for mobile */}
              <div className="flex flex-col space-y-2 pt-2 border-t border-border/50">
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
      <div className="h-16 md:h-20" aria-hidden />
    </>
  );
});
