'use client';

import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Key,
  UserCheck,
  Shield,
  DollarSign,
  UserX,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLatestLegalDocument } from '@/features/legal/api';

export default function TermsPage() {
  const { t, i18n: i18nInstance } = useTranslation();
  const currentLanguage = i18nInstance.language || 'en';
  const { data: document, isLoading } = useLatestLegalDocument('TERMS', currentLanguage, true);

  const content = document?.content || null;
  const lastUpdated = document?.publishedAt
    ? new Date(document.publishedAt).toLocaleDateString()
    : document?.updatedAt
      ? new Date(document.updatedAt).toLocaleDateString()
      : 'January 20, 2025';

  return (
    <LegalPageLayout titleKey="legal.terms.title" lastUpdated={lastUpdated}>
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
          <p className="text-lg text-muted-foreground mb-6">{t('legal.terms.description')}</p>

          <LegalSection
            icon={FileText}
            iconBgColor="bg-slate-100 dark:bg-slate-800"
            iconColor="text-slate-700 dark:text-slate-300"
            title={`1. ${t('legal.terms.acceptance.title')}`}
          >
            <p>{t('legal.terms.acceptance.desc')}</p>
            <Card className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <p className="text-sm">
                <strong>Important:</strong> {t('legal.terms.acceptance.important')}
              </p>
            </Card>
          </LegalSection>

          <LegalSection
            icon={Key}
            iconBgColor="bg-indigo-100 dark:bg-indigo-900"
            iconColor="text-indigo-700 dark:text-indigo-300"
            title={`2. ${t('legal.terms.license.title')}`}
          >
            <p>{t('legal.terms.license.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>{t('legal.terms.license.modifyCopy')}</li>
              <li>{t('legal.terms.license.commercialUse')}</li>
              <li>{t('legal.terms.license.reverseEngineer')}</li>
              <li>{t('legal.terms.license.removeCopyright')}</li>
              <li>{t('legal.terms.license.transfer')}</li>
            </ul>
          </LegalSection>

          <LegalSection
            icon={UserCheck}
            iconBgColor="bg-teal-100 dark:bg-teal-900"
            iconColor="text-teal-700 dark:text-teal-300"
            title={`3. ${t('legal.terms.account.title')}`}
          >
            <p>{t('legal.terms.account.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>{t('legal.terms.account.accurateInfo')}</li>
              <li>{t('legal.terms.account.updateInfo')}</li>
              <li>{t('legal.terms.account.security')}</li>
              <li>{t('legal.terms.account.notify')}</li>
              <li>{t('legal.terms.account.noSharing')}</li>
            </ul>
            <Card className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <p className="text-sm">
                <strong>⚠️ Security Notice:</strong> {t('legal.terms.account.securityNotice')}
              </p>
            </Card>
          </LegalSection>

          <LegalSection
            icon={Shield}
            iconBgColor="bg-blue-100 dark:bg-blue-900"
            iconColor="text-blue-700 dark:text-blue-300"
            title={`4. ${t('legal.terms.services.title')}`}
          >
            <p className="mb-4">{t('legal.terms.services.desc')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('legal.terms.services.noGuarantee')}</li>
              <li>{t('legal.terms.services.subjectToReview')}</li>
              <li>{t('legal.terms.services.processingTimes')}</li>
              <li>{t('legal.terms.services.additionalDocs')}</li>
            </ul>
            <Card className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border-2">
              <p className="text-sm">{t('legal.terms.services.ourRole')}</p>
            </Card>
          </LegalSection>

          <LegalSection
            icon={Shield}
            iconBgColor="bg-purple-100 dark:bg-purple-900"
            iconColor="text-purple-700 dark:text-purple-300"
            title={`5. ${t('legal.terms.privacy.title')}`}
          >
            <p>{t('legal.terms.privacy.desc')}</p>
            <p className="mt-2">{t('legal.terms.privacy.commitment')}</p>
          </LegalSection>

          <LegalSection
            icon={DollarSign}
            iconBgColor="bg-green-100 dark:bg-green-900"
            iconColor="text-green-700 dark:text-green-300"
            title={`6. ${t('legal.terms.fees.title')}`}
          >
            <p>{t('legal.terms.fees.desc')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>{t('legal.terms.fees.payFees')}</li>
              <li>{t('legal.terms.fees.accurateBilling')}</li>
              <li>{t('legal.terms.fees.authorizeCharges')}</li>
              <li>{t('legal.terms.fees.payRegardless')}</li>
            </ul>
            <h3 className="text-lg font-semibold mt-4 mb-2">
              {t('legal.terms.fees.refundPolicy')}
            </h3>
            <p>{t('legal.terms.fees.refundDesc')}</p>
          </LegalSection>

          <LegalSection
            icon={UserX}
            iconBgColor="bg-rose-100 dark:bg-rose-900"
            iconColor="text-rose-700 dark:text-rose-300"
            title={`7. ${t('legal.terms.termination.title')}`}
          >
            <p>{t('legal.terms.termination.userTermination')}</p>
            <p className="mt-2">{t('legal.terms.termination.weReserve')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>{t('legal.terms.termination.falseInfo')}</li>
              <li>{t('legal.terms.termination.illegalPurposes')}</li>
              <li>{t('legal.terms.termination.violateIP')}</li>
              <li>{t('legal.terms.termination.harassing')}</li>
              <li>{t('legal.terms.termination.compromiseSecurity')}</li>
            </ul>
            <Card className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <p className="text-sm">{t('legal.terms.termination.dataRetention')}</p>
            </Card>
          </LegalSection>

          <LegalSection
            icon={AlertTriangle}
            iconBgColor="bg-amber-100 dark:bg-amber-900"
            iconColor="text-amber-700 dark:text-amber-300"
            title={`8. ${t('legal.terms.liability.title')}`}
          >
            <p>{t('legal.terms.liability.desc')}</p>
            <p className="mt-4">{t('legal.terms.liability.jurisdiction')}</p>
          </LegalSection>

          <LegalSection
            icon={RefreshCw}
            iconBgColor="bg-cyan-100 dark:bg-cyan-900"
            iconColor="text-cyan-700 dark:text-cyan-300"
            title={`9. ${t('legal.terms.changes.title')}`}
          >
            <p>{t('legal.terms.changes.desc')}</p>
            <p className="mt-2">{t('legal.terms.changes.encourage')}</p>
          </LegalSection>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. {t('legal.terms.governing.title')}</h2>
            <p>{t('legal.terms.governing.desc')}</p>
            <p className="mt-2">{t('legal.terms.governing.disputes')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. {t('legal.terms.contact.title')}</h2>
            <p>{t('legal.terms.contact.desc')}</p>
            <div className="mt-4 space-y-1">
              <p>Email: {t('legal.supportEmail')}</p>
              <p>Address: {t('legal.address')}</p>
              <p>Response Time: {t('legal.responseTime')}</p>
            </div>
          </section>

          <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2">
            <div className="flex items-start gap-4">
              <FileText className="h-6 w-6 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">{t('legal.terms.acknowledgment.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('legal.terms.acknowledgment.desc')}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </LegalPageLayout>
  );
}
