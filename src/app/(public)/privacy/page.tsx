'use client';

import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { useTranslation } from 'react-i18next';
import { Info, Database, Lock, Shield, FileText, Globe, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLatestLegalDocument } from '@/features/legal/api';

export default function PrivacyPage() {
  const { t, i18n: i18nInstance } = useTranslation();
  const currentLanguage = i18nInstance.language || 'en';
  const { data: document, isLoading } = useLatestLegalDocument('PRIVACY', currentLanguage, true);

  const content = document?.content || null;
  const lastUpdated = document?.publishedAt
    ? new Date(document.publishedAt).toLocaleDateString()
    : document?.updatedAt
      ? new Date(document.updatedAt).toLocaleDateString()
      : 'January 20, 2025';

  return (
    <LegalPageLayout titleKey="legal.privacy.title" lastUpdated={lastUpdated}>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      ) : content ? (
        <div className="prose dark:prose-invert max-w-none mb-10 whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <>
          <p className="text-lg text-muted-foreground mb-6">{t('legal.privacy.description')}</p>
          <p className="mb-6">{t('legal.privacy.intro')}</p>

          <LegalSection
            icon={Database}
            iconBgColor="bg-slate-100 dark:bg-slate-800"
            iconColor="text-slate-700 dark:text-slate-300"
            title={`1. ${t('legal.privacy.informationWeCollect.title')}`}
          >
            <h3 className="text-xl font-semibold mb-3 mt-4">
              {t('legal.privacy.informationWeCollect.personalInfo')}
            </h3>
            <p>{t('legal.privacy.informationWeCollect.personalDesc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>
                  {t('legal.privacy.informationWeCollect.accountInfo').split(':')[0]}:
                </strong>{' '}
                {t('legal.privacy.informationWeCollect.accountInfo').split(':').slice(1).join(':')}
              </li>
              <li>
                <strong>
                  {t('legal.privacy.informationWeCollect.immigrationDocs').split(':')[0]}:
                </strong>{' '}
                {t('legal.privacy.informationWeCollect.immigrationDocs')
                  .split(':')
                  .slice(1)
                  .join(':')}
              </li>
              <li>
                <strong>{t('legal.privacy.informationWeCollect.caseInfo').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.informationWeCollect.caseInfo').split(':').slice(1).join(':')}
              </li>
              <li>
                <strong>
                  {t('legal.privacy.informationWeCollect.communicationData').split(':')[0]}:
                </strong>{' '}
                {t('legal.privacy.informationWeCollect.communicationData')
                  .split(':')
                  .slice(1)
                  .join(':')}
              </li>
              <li>
                <strong>{t('legal.privacy.informationWeCollect.deviceInfo').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.informationWeCollect.deviceInfo').split(':').slice(1).join(':')}
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">
              {t('legal.privacy.informationWeCollect.autoCollected')}
            </h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>{t('legal.privacy.informationWeCollect.usageData')}</li>
              <li>{t('legal.privacy.informationWeCollect.logData')}</li>
              <li>{t('legal.privacy.informationWeCollect.deviceIdentifiers')}</li>
            </ul>
          </LegalSection>

          <LegalSection
            icon={Info}
            iconBgColor="bg-indigo-100 dark:bg-indigo-900"
            iconColor="text-indigo-700 dark:text-indigo-300"
            title={`2. ${t('legal.privacy.howWeUse.title')}`}
          >
            <p>{t('legal.privacy.howWeUse.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.howWeUse.serviceProvision').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.howWeUse.serviceProvision').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.howWeUse.communication').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.howWeUse.communication').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.howWeUse.accountMgmt').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.howWeUse.accountMgmt').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.howWeUse.security').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.howWeUse.security').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.howWeUse.legalCompliance').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.howWeUse.legalCompliance').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.howWeUse.serviceImprovement').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.howWeUse.serviceImprovement').split(':')[1]}
              </li>
            </ul>
          </LegalSection>

          <LegalSection
            icon={FileText}
            iconBgColor="bg-teal-100 dark:bg-teal-900"
            iconColor="text-teal-700 dark:text-teal-300"
            title={`3. ${t('legal.privacy.legalBasis.title')}`}
          >
            <p>{t('legal.privacy.legalBasis.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.legalBasis.consent').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.legalBasis.consent').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.legalBasis.contract').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.legalBasis.contract').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.legalBasis.legalObligation').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.legalBasis.legalObligation').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.legalBasis.legitimateInterest').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.legalBasis.legitimateInterest').split(':')[1]}
              </li>
            </ul>
          </LegalSection>

          <LegalSection
            icon={Globe}
            iconBgColor="bg-blue-100 dark:bg-blue-900"
            iconColor="text-blue-700 dark:text-blue-300"
            title={`4. ${t('legal.privacy.dataSharing.title')}`}
          >
            <p>{t('legal.privacy.dataSharing.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.dataSharing.immigrationAuth').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSharing.immigrationAuth').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSharing.serviceProviders').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSharing.serviceProviders').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSharing.legalAuth').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSharing.legalAuth').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSharing.businessTransfers').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSharing.businessTransfers').split(':')[1]}
              </li>
            </ul>
            <Card className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <p className="text-sm">✓ {t('legal.privacy.dataSharing.noSelling')}</p>
            </Card>
          </LegalSection>

          <LegalSection
            icon={Shield}
            iconBgColor="bg-purple-100 dark:bg-purple-900"
            iconColor="text-purple-700 dark:text-purple-300"
            title={`5. ${t('legal.privacy.yourRights.title')}`}
          >
            <p>{t('legal.privacy.yourRights.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.yourRights.access').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.access').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.rectification').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.rectification').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.erasure').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.erasure').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.portability').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.portability').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.restrict').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.restrict').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.object').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.object').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.withdraw').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.withdraw').split(':')[1]}
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">
              {t('legal.privacy.yourRights.howToExercise')}
            </h3>
            <p>{t('legal.privacy.yourRights.exerciseDesc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.yourRights.accountSettings').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.accountSettings').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.email')}:</strong> {t('legal.contactEmail')}
              </li>
              <li>
                <strong>{t('legal.privacy.yourRights.mobileApp').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.yourRights.mobileApp').split(':')[1]}
              </li>
            </ul>
            <p className="mt-2">{t('legal.privacy.yourRights.responseTime')}</p>
          </LegalSection>

          <LegalSection
            icon={Lock}
            iconBgColor="bg-rose-100 dark:bg-rose-900"
            iconColor="text-rose-700 dark:text-rose-300"
            title={`6. ${t('legal.privacy.dataSecurity.title')}`}
          >
            <p>{t('legal.privacy.dataSecurity.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.dataSecurity.encryption').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSecurity.encryption').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSecurity.authentication').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSecurity.authentication').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSecurity.accessControl').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSecurity.accessControl').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSecurity.regularAudits').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSecurity.regularAudits').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataSecurity.secureStorage').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataSecurity.secureStorage').split(':')[1]}
              </li>
            </ul>
          </LegalSection>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. {t('legal.privacy.dataRetention.title')}
            </h2>
            <p>{t('legal.privacy.dataRetention.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>{t('legal.privacy.dataRetention.activeAccounts').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataRetention.activeAccounts').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataRetention.deletedAccounts').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataRetention.deletedAccounts').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataRetention.legalRequirements').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataRetention.legalRequirements').split(':')[1]}
              </li>
              <li>
                <strong>{t('legal.privacy.dataRetention.caseRecords').split(':')[0]}:</strong>{' '}
                {t('legal.privacy.dataRetention.caseRecords').split(':')[1]}
              </li>
            </ul>
          </section>

          <LegalSection
            icon={Mail}
            iconBgColor="bg-amber-100 dark:bg-amber-900"
            iconColor="text-amber-700 dark:text-amber-300"
            title={`8. ${t('legal.privacy.contact.title')}`}
          >
            <p>{t('legal.privacy.contact.desc')}</p>
            <div className="mt-4 space-y-1">
              <p>
                <strong>{t('legal.privacy.contact.dpo')}</strong>
              </p>
              <p>Email: {t('legal.contactEmail')}</p>
              <p>Address: {t('legal.address')}</p>
              <p>Response Time: {t('legal.responseTime')}</p>
            </div>
          </LegalSection>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. {t('legal.privacy.supervisory.title')}
            </h2>
            <p>{t('legal.privacy.supervisory.desc')}</p>
          </section>
        </>
      )}
    </LegalPageLayout>
  );
}
