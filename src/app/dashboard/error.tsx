'use client';

// Dashboard error boundary

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    // Log the error
    logger.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-2xl border-destructive/20">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <div className="absolute inset-0 rounded-full bg-destructive/5 animate-ping" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('errors.somethingWentWrong')}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">{t('errors.pageLoadError')}</p>
            </div>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-muted/50 border border-destructive/20 rounded-lg p-4 text-left max-w-xl mx-auto">
                <p className="text-xs font-mono text-destructive break-all">{error.message}</p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('errors.errorId')}: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common.tryAgain')}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t('common.dashboardHome')}
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                {t('errors.ifProblemPersists')}{' '}
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
