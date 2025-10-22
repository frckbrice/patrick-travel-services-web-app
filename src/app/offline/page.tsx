'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
              <div className="relative bg-primary/10 p-6 rounded-full">
                <WifiOff className="h-16 w-16 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{t('offline.title')}</h1>
              <p className="text-muted-foreground">{t('offline.description')}</p>
            </div>

            <div className="w-full space-y-3">
              <Button className="w-full" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('offline.tryAgain')}
              </Button>

              <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                {t('offline.goBack')}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">{t('offline.whileOffline')}</p>
              <ul className="text-left space-y-1 ml-4">
                <li>• {t('offline.features.viewPages')}</li>
                <li>• {t('offline.features.accessCache')}</li>
                <li>• {t('offline.features.reviewCases')}</li>
              </ul>
            </div>

            <div className="pt-4 text-xs text-muted-foreground">{t('offline.syncMessage')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
