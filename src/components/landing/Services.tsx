'use client';

import { useTranslation } from 'react-i18next';
import { GraduationCap, Briefcase, Users, Plane, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Services() {
  const { t } = useTranslation();

  const services = [
    {
      icon: GraduationCap,
      title: t('landing.services.student'),
      description: t('landing.services.studentDesc'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badge: t('landing.services.mostPopular'),
      badgeVariant: 'default' as const,
    },
    {
      icon: Briefcase,
      title: t('landing.services.work'),
      description: t('landing.services.workDesc'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      badge: t('landing.services.highDemand'),
      badgeVariant: 'secondary' as const,
    },
    {
      icon: Users,
      title: t('landing.services.family'),
      description: t('landing.services.familyDesc'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      icon: Plane,
      title: t('landing.services.business'),
      description: t('landing.services.businessDesc'),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
  ];

  return (
    <section className="relative py-16 md:py-20 lg:py-24">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {t('landing.services.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landing.services.subtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${service.borderColor} border-2`}
              >
                {service.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge variant={service.badgeVariant} className="text-xs">
                      {service.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-8 w-8 ${service.color}`} />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {service.description}
                  </CardDescription>
                  <Button variant="ghost" className="mt-4 px-0 group-hover:gap-2 transition-all">
                    {t('landing.services.learnMore')}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" variant="outline" className="text-lg px-8 h-12">
            {t('landing.services.viewAll')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
