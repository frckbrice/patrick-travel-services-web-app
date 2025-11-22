'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { GraduationCap, Briefcase, Users, Plane, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressiveSection } from '@/components/ui/progressive-section';

interface Service {
  icon: typeof GraduationCap;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary';
  href: string;
}

export function Services() {
  const { t } = useTranslation();

  const services = useMemo<Service[]>(
    () => [
      {
        icon: GraduationCap,
        title: t('landing.services.student'),
        description: t('landing.services.studentDesc'),
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        badge: t('landing.services.mostPopular'),
        badgeVariant: 'default',
        href: '/services/student-visa',
      },
      {
        icon: Briefcase,
        title: t('landing.services.work'),
        description: t('landing.services.workDesc'),
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        badge: t('landing.services.highDemand'),
        badgeVariant: 'secondary',
        href: '/services/work-permit',
      },
      {
        icon: Users,
        title: t('landing.services.family'),
        description: t('landing.services.familyDesc'),
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        href: '/services/family-reunification',
      },
      {
        icon: Plane,
        title: t('landing.services.business'),
        description: t('landing.services.businessDesc'),
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        href: '/services/business-visa',
      },
    ],
    [t]
  );

  return (
    <ProgressiveSection
      delay={300}
      duration={800}
      as="section"
      className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-transparent"
    >
      <div
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hero-content-visible"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span suppressHydrationWarning>{t('landing.services.title')}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            <span suppressHydrationWarning>{t('landing.services.subtitle')}</span>
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={`service-${index}`}
                className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 ${service.borderColor} border-2 optimize-rendering`}
              >
                {service.badge && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                    <Badge
                      variant={service.badgeVariant}
                      className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1"
                    >
                      <span suppressHydrationWarning>{service.badge}</span>
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-2 sm:pb-4 p-4 sm:p-6">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${service.bgColor} flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${service.color}`} aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base sm:text-xl leading-tight">
                    <span suppressHydrationWarning>{service.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-none">
                    <span suppressHydrationWarning>{service.description}</span>
                  </CardDescription>
                  <Button
                    variant="ghost"
                    className="mt-2 sm:mt-4 px-0 h-auto py-1 text-xs sm:text-sm group-hover:gap-2 transition-all"
                    asChild
                  >
                    <Link href={service.href}>
                      <span suppressHydrationWarning>{t('landing.services.learnMore')}</span>
                      <ArrowRight
                        className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" variant="outline" className="text-lg px-8 h-12 cursor-not-allowed">
            <span suppressHydrationWarning>{t('landing.services.viewAll')}</span>
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </ProgressiveSection>
  );
}
