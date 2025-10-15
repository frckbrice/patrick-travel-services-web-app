'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];

    const languageCode = i18n.language.split('-')[0];
    const currentLanguage = languages.find(lang => lang.code === languageCode) || languages[0];

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', langCode);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => changeLanguage(language.code)}
                        className="gap-2"
                    >
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        {currentLanguage.code === language.code && (
                            <span className="ml-auto text-primary">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
