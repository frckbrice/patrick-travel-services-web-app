'use client';

// Unauthorized access page (403)

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <Card className="w-full max-w-2xl border-2 border-orange-200 dark:border-orange-900">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* 403 Icon */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ShieldAlert className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{t('errors.accessDenied')}</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {t('errors.noPermission')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  {t('common.goToDashboard')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common.goBack')}
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                {t('errors.needHelp')}{' '}
                <Link href="/dashboard/faq" className="text-primary hover:underline font-medium">
                  {t('common.faq')}
                </Link>{' '}
                {t('common.or')}{' '}
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
