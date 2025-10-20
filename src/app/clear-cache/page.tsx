'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import {
  clearServiceWorkerAndCache,
  isServiceWorkerActive,
  getServiceWorkers,
  getCacheNames,
  clearApiCache,
} from '@/lib/utils/clear-sw-cache';

export default function ClearCachePage() {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const [swActive, setSwActive] = useState(false);
  const [swCount, setSwCount] = useState(0);
  const [cacheCount, setCacheCount] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setSwActive(isServiceWorkerActive());
    const sws = await getServiceWorkers();
    const caches = await getCacheNames();
    setSwCount(sws.length);
    setCacheCount(caches.length);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    setMessage(null);
    try {
      await clearServiceWorkerAndCache();
      setMessage({
        type: 'success',
        text: t('cache.clearAllSuccess'),
      });
      await checkStatus();

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: t('cache.clearError', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearApiCache = async () => {
    setIsClearing(true);
    setMessage(null);
    try {
      await clearApiCache();
      setMessage({
        type: 'success',
        text: t('cache.clearApiSuccess'),
      });
      await checkStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: t('cache.clearApiError', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('cache.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('cache.description')}</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-900 border border-green-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('cache.serviceWorkers')}</CardTitle>
            <CardDescription>{t('cache.serviceWorkersDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{swCount}</span>
              {swActive ? (
                <Badge variant="default" className="bg-green-600">
                  {t('cache.active')}
                </Badge>
              ) : (
                <Badge variant="secondary">{t('cache.inactive')}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('cache.caches')}</CardTitle>
            <CardDescription>{t('cache.cachesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{cacheCount}</span>
              <Badge variant="secondary">
                {cacheCount > 0 ? t('cache.present') : t('cache.empty')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cache.management')}</CardTitle>
          <CardDescription>{t('cache.managementDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={handleClearAll}
              disabled={isClearing}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('cache.clearing')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('cache.clearAll')}
                </>
              )}
            </Button>

            <Button
              onClick={handleClearApiCache}
              disabled={isClearing}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('cache.clearing')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('cache.clearApiOnly')}
                </>
              )}
            </Button>

            <Button
              onClick={checkStatus}
              disabled={isClearing}
              className="w-full"
              size="lg"
              variant="ghost"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('cache.refreshStatus')}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('cache.devMode')}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('cache.devModeDescription')}
            </p>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              {t('cache.manualClearing')}
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('cache.manualClearingDescription')}
            </p>
            <ol className="text-sm text-amber-800 dark:text-amber-200 mt-2 ml-4 list-decimal space-y-1">
              <li>{t('cache.manualStep1')}</li>
              <li>{t('cache.manualStep2')}</li>
              <li>{t('cache.manualStep3')}</li>
              <li>{t('cache.manualStep4')}</li>
              <li>{t('cache.manualStep5')}</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
