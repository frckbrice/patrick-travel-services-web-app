'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';

export function I18nProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        // Initialize i18n
        if (!i18n.isInitialized) {
            i18n.init();
        }
    }, []);

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

