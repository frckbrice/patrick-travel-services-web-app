'use client';

import { LegalSection } from '@/components/legal/LegalSection';
import { useTranslation } from 'react-i18next';
import {
  Info,
  Database,
  Lock,
  Shield,
  FileText,
  Globe,
  Mail,
  Calendar,
  ArrowLeft,
  Scale,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLatestLegalDocument } from '@/features/legal/api';
import Link from 'next/link';

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Header Section */}
      <div className="relative border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/50 shadow-sm">
        <div className="container max-w-5xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 sm:mb-6 hover:bg-primary/10 text-sm sm:text-base"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.goHome')}
            </Link>
          </Button>

          <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-primary/20 shrink-0">
              <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 leading-[1.2] sm:leading-[1.15]">
                {t('legal.privacy.title')}
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">
                  {t('legal.lastUpdated')}:{' '}
                  <strong className="text-foreground">{lastUpdated}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative container max-w-4xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-transparent">
        <Card className="p-4 sm:p-6 md:p-8 lg:p-12 shadow-xl border-2 bg-background/90 backdrop-blur-sm">
          <div
            className="prose prose-slate dark:prose-invert max-w-none 
            prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-2xl prose-h1:sm:text-3xl prose-h1:md:text-4xl prose-h1:font-bold prose-h1:mt-6 prose-h1:mb-4 prose-h1:leading-[1.2]
            prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:md:text-3xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h2:sm:mt-8 prose-h2:sm:mb-4 prose-h2:leading-[1.25]
            prose-h3:text-lg prose-h3:sm:text-xl prose-h3:md:text-2xl prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:sm:mt-6 prose-h3:sm:mb-3 prose-h3:leading-[1.3]
            prose-h4:text-base prose-h4:sm:text-lg prose-h4:md:text-xl prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2 prose-h4:leading-[1.35]
            prose-p:text-base prose-p:sm:text-[16px] prose-p:leading-relaxed prose-p:mb-4 prose-p:sm:mb-5 prose-p:leading-[1.6] prose-p:sm:leading-[1.65]
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:decoration-2
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:space-y-2 prose-ul:sm:space-y-2.5 prose-ul:mb-4 prose-ul:sm:mb-5 prose-ul:pl-4 prose-ul:sm:pl-6
            prose-ol:space-y-2 prose-ol:sm:space-y-2.5 prose-ol:mb-4 prose-ol:sm:mb-5 prose-ol:pl-4 prose-ol:sm:pl-6
            prose-li:text-base prose-li:sm:text-[16px] prose-li:leading-relaxed prose-li:marker:text-primary prose-li:mb-1
            prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:sm:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4 prose-blockquote:sm:my-5
            prose-code:text-sm prose-code:font-mono prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:p-4 prose-pre:sm:p-6 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:sm:text-base
            prose-table:w-full prose-table:border-collapse prose-table:my-4 prose-table:sm:my-6
            prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:sm:px-4 prose-th:sm:py-3 prose-th:text-left prose-th:font-semibold prose-th:bg-muted
            prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:sm:px-4 prose-td:sm:py-3
            prose-img:rounded-lg prose-img:my-4 prose-img:sm:my-6
            prose-hr:border-border prose-hr:my-6 prose-hr:sm:my-8"
          >
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
                <p className="text-lg text-muted-foreground mb-6">
                  {t('legal.privacy.description')}
                </p>
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
                      {t('legal.privacy.informationWeCollect.accountInfo')
                        .split(':')
                        .slice(1)
                        .join(':')}
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
                      <strong>
                        {t('legal.privacy.informationWeCollect.caseInfo').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.informationWeCollect.caseInfo')
                        .split(':')
                        .slice(1)
                        .join(':')}
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
                      <strong>
                        {t('legal.privacy.informationWeCollect.deviceInfo').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.informationWeCollect.deviceInfo')
                        .split(':')
                        .slice(1)
                        .join(':')}
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
                      <strong>
                        {t('legal.privacy.howWeUse.serviceImprovement').split(':')[0]}:
                      </strong>{' '}
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
                      <strong>
                        {t('legal.privacy.legalBasis.legalObligation').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.legalBasis.legalObligation').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.legalBasis.legitimateInterest').split(':')[0]}:
                      </strong>{' '}
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
                      <strong>
                        {t('legal.privacy.dataSharing.immigrationAuth').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataSharing.immigrationAuth').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataSharing.serviceProviders').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataSharing.serviceProviders').split(':')[1]}
                    </li>
                    <li>
                      <strong>{t('legal.privacy.dataSharing.legalAuth').split(':')[0]}:</strong>{' '}
                      {t('legal.privacy.dataSharing.legalAuth').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataSharing.businessTransfers').split(':')[0]}:
                      </strong>{' '}
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
                      <strong>
                        {t('legal.privacy.yourRights.accountSettings').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.yourRights.accountSettings').split(':')[1]}
                    </li>
                    <li>
                      <strong>{t('legal.privacy.yourRights.email')}:</strong>{' '}
                      {t('legal.contactEmail')}
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
                      <strong>
                        {t('legal.privacy.dataSecurity.authentication').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataSecurity.authentication').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataSecurity.accessControl').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataSecurity.accessControl').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataSecurity.regularAudits').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataSecurity.regularAudits').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataSecurity.secureStorage').split(':')[0]}:
                      </strong>{' '}
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
                      <strong>
                        {t('legal.privacy.dataRetention.activeAccounts').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataRetention.activeAccounts').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataRetention.deletedAccounts').split(':')[0]}:
                      </strong>{' '}
                      {t('legal.privacy.dataRetention.deletedAccounts').split(':')[1]}
                    </li>
                    <li>
                      <strong>
                        {t('legal.privacy.dataRetention.legalRequirements').split(':')[0]}:
                      </strong>{' '}
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
          </div>
        </Card>
      </div>
    </div>
  );
}
