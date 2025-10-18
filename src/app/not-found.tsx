'use client';

// Global 404 Not Found page

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <Card className="w-full max-w-2xl border-2">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* 404 Illustration */}
            <div className="relative">
              <h1 className="text-9xl font-bold text-primary/10 select-none">404</h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-20 w-20 text-primary/30 animate-pulse" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{t('errors.pageNotFound')}</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {t('errors.pageNotFoundDescription')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button asChild size="lg">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t('common.goHome')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common.backToDashboard')}
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                {t('errors.ifErrorPersists')}{' '}
                <Link
                  href="/dashboard/messages"
                  className="text-primary hover:underline font-medium"
                >
                  {t('common.contactSupport')}
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
