'use client';

import { useTranslation } from 'react-i18next';
import { TemplatesLibrary } from '@/features/documents/components/TemplatesLibrary';

export default function ResourcesPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('templates.title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('templates.pageDescription')}
                </p>
            </div>

            <TemplatesLibrary />
        </div>
    );
}

