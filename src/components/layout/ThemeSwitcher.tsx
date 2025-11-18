'use client';

import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-md bg-gray-200 animate-pulse"></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-auto min-w-[40px] h-10 px-3 rounded-md hover:bg-muted dark:hover:bg-muted transition-colors flex items-center justify-center border border-border bg-background shadow-sm"
      aria-label={t('common.toggleTheme')}
      title={t('common.toggleTheme')}
    >
      {theme === 'dark' ? (
        <span className="text-lg sm:text-xl">☀️</span>
      ) : (
        <span className="text-lg sm:text-xl">🌙</span>
      )}
    </button>
  );
}
