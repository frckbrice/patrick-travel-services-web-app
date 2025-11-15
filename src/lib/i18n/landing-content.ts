'use server';

import 'server-only';

import { cookies } from 'next/headers';
import en from '@/lib/i18n/locales/en.json';
import fr from '@/lib/i18n/locales/fr.json';

const dictionaries = {
  en,
  fr,
};

export type LandingCopy = typeof en.landing;

async function resolveLocale(): Promise<keyof typeof dictionaries> {
  const cookieLang = (await cookies()).get('i18nextLng')?.value;
  if (!cookieLang) {
    return 'en';
  }

  const normalized = cookieLang.split('-')[0]?.toLowerCase() as keyof typeof dictionaries;
  return normalized && dictionaries[normalized] ? normalized : 'en';
}

export async function getLandingCopy(): Promise<LandingCopy> {
  const locale = await resolveLocale();
  return dictionaries[locale].landing;
}
