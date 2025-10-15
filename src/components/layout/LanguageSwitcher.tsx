'use client';

import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lng);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    i18n.language === 'en'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('fr')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    i18n.language === 'fr'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
            >
                FR
            </button>
        </div>
    );
}

