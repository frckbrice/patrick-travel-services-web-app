'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuthStore } from '@/features/auth/store';

// PERFORMANCE: Memoized Navbar component
export const Navbar = memo(function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  // Prevent hydration mismatch by only rendering translations after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // PERFORMANCE: Memoize navigation to prevent recalculation
  const navigation = useMemo(
    () => [
      { name: t('landing.footer.services'), href: '#services' },
      { name: t('landing.testimonials.title'), href: '#testimonials' },
      { name: t('landing.contact.title'), href: '#contact' },
      { name: t('landing.footer.about'), href: '/about' },
    ],
    [t]
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          {/* PERFORMANCE: Priority loading for logo (above the fold) */}
          <Image
            src="/images/app-logo.png"
            alt="Patrick Travel Services"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          <span className="font-bold text-primary hidden sm:inline-block">
            Patrick Travel Services
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {mounted &&
            navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.name}
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
            {mounted && isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t('common.dashboard') || 'Dashboard'}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">{mounted ? t('auth.login') : 'Login'}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{mounted ? t('auth.signUp') : 'Sign Up'}</Link>
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
      {isMenuOpen && mounted && (
        <div className="md:hidden border-t">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
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
                    {t('common.dashboard') || 'Dashboard'}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">{t('auth.login')}</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/register">{t('auth.signUp')}</Link>
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
