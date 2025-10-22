'use client';

import { useTranslation } from 'react-i18next';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface LegalPageLayoutProps {
  titleKey: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ titleKey, lastUpdated, children }: LegalPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header Section */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.goHome')}
            </Link>
          </Button>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{t(titleKey)}</h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {t('legal.lastUpdated')}: {lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="p-8 md:p-12 shadow-lg border-2">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20">
            {children}
          </div>
        </Card>

        {/* Footer Note */}
        <Card className="mt-8 p-6 bg-muted/50 border-2 border-dashed">
          <p className="text-sm text-muted-foreground">
            <strong>{t('legal.disclaimer')}:</strong> {t('legal.disclaimerText')}
          </p>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/privacy">{t('legal.privacy.title')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/terms">{t('legal.terms.title')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/cookies">{t('legal.cookies.title')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
