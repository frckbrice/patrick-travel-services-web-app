'use client';

// Global error handler (catches errors in root layout)
// NOTE: This component renders outside the app context, so we use browser language detection

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

// Embedded translations for global error (since i18n context is unavailable)
const translations = {
  en: {
    title: 'Critical Error',
    description: 'A critical error occurred. Please try refreshing the page.',
    tryAgain: 'Try Again',
    goHome: 'Go Home',
    errorId: 'Error ID',
  },
  fr: {
    title: 'Erreur Critique',
    description: 'Une erreur critique s\'est produite. Veuillez essayer de rafraîchir la page.',
    tryAgain: 'Réessayer',
    goHome: 'Retour à l\'Accueil',
    errorId: 'ID de l\'Erreur',
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    // Log to monitoring service
    logger.error('Global error:', error);

    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) {
      setLocale('fr');
    }
  }, [error]);

  const t = translations[locale];

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-900 rounded-lg shadow-xl">
            <div className="p-12">
              <div className="text-center space-y-6">
                {/* Error Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-red-200/50 dark:bg-red-900/20 animate-ping" />
                  </div>
                </div>

                {/* Error Message */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {t.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
                    {t.description}
                  </p>
                </div>

                {/* Error Details */}
                {process.env.NODE_ENV === 'development' && error.message && (
                  <div className="bg-gray-100 dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left max-w-xl mx-auto">
                    <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                      {error.message}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {t.errorId}: {error.digest}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={reset}
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.tryAgain}
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {t.goHome}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
