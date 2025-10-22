'use client';

import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { useTranslation } from 'react-i18next';
import { Cookie, Settings, Shield, Globe, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CookiesPage() {
  const { t } = useTranslation();

  return (
    <LegalPageLayout titleKey="legal.cookies.title" lastUpdated="January 20, 2025">
      <p className="text-lg text-muted-foreground mb-6">{t('legal.cookies.description')}</p>

      <LegalSection
        icon={Cookie}
        iconBgColor="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-700 dark:text-slate-300"
        title={`1. ${t('legal.cookies.whatAre.title')}`}
      >
        <p>{t('legal.cookies.whatAre.desc1')}</p>
        <p className="mt-4">{t('legal.cookies.whatAre.desc2')}</p>
      </LegalSection>

      <LegalSection
        icon={Settings}
        iconBgColor="bg-indigo-100 dark:bg-indigo-900"
        iconColor="text-indigo-700 dark:text-indigo-300"
        title={`2. ${t('legal.cookies.howWeUse.title')}`}
      >
        <p>{t('legal.cookies.howWeUse.desc')}</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>{t('legal.cookies.howWeUse.authentication').split(':')[0]}:</strong>{' '}
            {t('legal.cookies.howWeUse.authentication').split(':')[1]}
          </li>
          <li>
            <strong>{t('legal.cookies.howWeUse.security').split(':')[0]}:</strong>{' '}
            {t('legal.cookies.howWeUse.security').split(':')[1]}
          </li>
          <li>
            <strong>{t('legal.cookies.howWeUse.preferences').split(':')[0]}:</strong>{' '}
            {t('legal.cookies.howWeUse.preferences').split(':')[1]}
          </li>
          <li>
            <strong>{t('legal.cookies.howWeUse.analytics').split(':')[0]}:</strong>{' '}
            {t('legal.cookies.howWeUse.analytics').split(':')[1]}
          </li>
          <li>
            <strong>{t('legal.cookies.howWeUse.performance').split(':')[0]}:</strong>{' '}
            {t('legal.cookies.howWeUse.performance').split(':')[1]}
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        icon={Shield}
        iconBgColor="bg-teal-100 dark:bg-teal-900"
        iconColor="text-teal-700 dark:text-teal-300"
        title={`3. ${t('legal.cookies.types.title')}`}
      >
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-slate-500">
            <h3 className="text-lg font-semibold mb-2">
              {t('legal.cookies.types.essential.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.types.essential.desc')}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <strong>Examples:</strong> {t('legal.cookies.types.essential.examples')}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500">
            <h3 className="text-lg font-semibold mb-2">
              {t('legal.cookies.types.functional.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.types.functional.desc')}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <strong>Examples:</strong> {t('legal.cookies.types.functional.examples')}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <h3 className="text-lg font-semibold mb-2">
              {t('legal.cookies.types.analytics.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.types.analytics.desc')}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <strong>Examples:</strong> {t('legal.cookies.types.analytics.examples')}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <h3 className="text-lg font-semibold mb-2">
              {t('legal.cookies.types.performance.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.types.performance.desc')}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <strong>Examples:</strong> {t('legal.cookies.types.performance.examples')}
            </div>
          </Card>
        </div>
      </LegalSection>

      <LegalSection
        icon={Globe}
        iconBgColor="bg-rose-100 dark:bg-rose-900"
        iconColor="text-rose-700 dark:text-rose-300"
        title={`4. ${t('legal.cookies.thirdParty.title')}`}
      >
        <p>{t('legal.cookies.thirdParty.desc')}</p>
        <div className="mt-4 space-y-3">
          <Card className="p-4">
            <h3 className="font-semibold mb-1">{t('legal.cookies.thirdParty.firebase.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.thirdParty.firebase.desc')}
            </p>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              {t('legal.cookies.thirdParty.firebase.link')} →
            </a>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-1">
              {t('legal.cookies.thirdParty.uploadthing.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.thirdParty.uploadthing.desc')}
            </p>
            <a
              href="https://uploadthing.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              {t('legal.cookies.thirdParty.uploadthing.link')} →
            </a>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-1">{t('legal.cookies.thirdParty.expo.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.thirdParty.expo.desc')}
            </p>
            <a
              href="https://expo.dev/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              {t('legal.cookies.thirdParty.expo.link')} →
            </a>
          </Card>
        </div>
      </LegalSection>

      <LegalSection
        icon={Settings}
        iconBgColor="bg-amber-100 dark:bg-amber-900"
        iconColor="text-amber-700 dark:text-amber-300"
        title={`5. ${t('legal.cookies.manage.title')}`}
      >
        <h3 className="text-xl font-semibold mb-3 mt-4">
          {t('legal.cookies.manage.browserSettings')}
        </h3>
        <p>{t('legal.cookies.manage.browserDesc')}</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>{t('legal.cookies.manage.viewDelete')}</li>
          <li>{t('legal.cookies.manage.blockThirdParty')}</li>
          <li>{t('legal.cookies.manage.blockSpecific')}</li>
          <li>{t('legal.cookies.manage.blockAll')}</li>
          <li>{t('legal.cookies.manage.deleteOnClose')}</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">
          {t('legal.cookies.manage.browserSpecific')}
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Google Chrome:</strong>{' '}
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('legal.cookies.manage.chrome')}
            </a>
          </p>
          <p>
            <strong>Mozilla Firefox:</strong>{' '}
            <a
              href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('legal.cookies.manage.firefox')}
            </a>
          </p>
          <p>
            <strong>Safari:</strong>{' '}
            <a
              href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('legal.cookies.manage.safari')}
            </a>
          </p>
          <p>
            <strong>Microsoft Edge:</strong>{' '}
            <a
              href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('legal.cookies.manage.edge')}
            </a>
          </p>
        </div>

        <Card className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <p className="text-sm">
            <strong>⚠️ Important:</strong> {t('legal.cookies.manage.important')}
          </p>
        </Card>
      </LegalSection>

      <LegalSection
        icon={RefreshCw}
        iconBgColor="bg-cyan-100 dark:bg-cyan-900"
        iconColor="text-cyan-700 dark:text-cyan-300"
        title={`6. ${t('legal.cookies.updates.title')}`}
      >
        <p>{t('legal.cookies.updates.desc1')}</p>
        <p className="mt-4">{t('legal.cookies.updates.desc2')}</p>
      </LegalSection>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. {t('legal.cookies.contact.title')}</h2>
        <p>{t('legal.cookies.contact.desc')}</p>
        <div className="mt-4 space-y-1">
          <p>
            <strong>Email:</strong> {t('legal.contactEmail')}
          </p>
          <p>
            <strong>Address:</strong> {t('legal.address')}
          </p>
          <p>
            <strong>Response Time:</strong> {t('legal.responseTime')}
          </p>
        </div>
      </section>

      <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2">
        <div className="flex items-start gap-4">
          <Cookie className="h-6 w-6 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">{t('legal.cookies.privacyMatters.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.privacyMatters.desc')}
            </p>
          </div>
        </div>
      </Card>
    </LegalPageLayout>
  );
}
