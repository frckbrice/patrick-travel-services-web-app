'use client';

// Dashboard-specific 404 page

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function DashboardNotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* 404 Illustration */}
            <div className="relative">
              <h1 className="text-8xl font-bold text-primary/10 select-none">404</h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-16 w-16 text-primary/30" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('errors.pageNotFound')}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('errors.dashboardPageNotFound')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t('common.dashboardHome')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common.goBack')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
