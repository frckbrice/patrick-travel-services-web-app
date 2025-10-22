'use client';

// Global error boundary

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    // Log the error to monitoring service
    logger.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <Card className="w-full max-w-2xl border-2 border-destructive/20">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <div className="absolute inset-0 rounded-full bg-destructive/5 animate-ping" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {t('errors.somethingWentWrong')}
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {t('errors.unexpectedError')}
              </p>
            </div>

            {/* Error Details (development only) */}
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
              <Button onClick={reset} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common.tryAgain')}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t('common.goHome')}
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
