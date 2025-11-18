'use client';

import Image from 'next/image';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Award, Users, TrendingUp, Clock, Globe, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  position?: string;
  isDesktop?: boolean;
}

const FeatureCardComponent = ({
  icon: Icon,
  title,
  description,
  gradient,
  position,
  isDesktop,
}: FeatureCardProps) => (
  <Card
    className={`group relative overflow-hidden border-2 border-primary/30 transition-all duration-200 shadow-xl ${
      isDesktop ? `absolute w-56 ${position} z-20 bg-card/95 backdrop-blur-sm` : ''
    }`}
  >
    <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-5">
      <div className="relative">
        <div
          className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-linear-to-br ${gradient} shadow-lg`}
          aria-label={title}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div
          className={`pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl bg-linear-to-br ${gradient} opacity-20 blur-xl`}
        />
      </div>
      <div className={isDesktop ? 'space-y-2' : 'space-y-1'}>
        <h3 className="text-sm sm:text-lg font-bold text-primary leading-tight">
          <span suppressHydrationWarning>{title}</span>
        </h3>
        <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-none">
          <span suppressHydrationWarning>{description}</span>
        </p>
      </div>
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${gradient} opacity-5`}
      />
    </CardContent>
  </Card>
);

const FeatureCard = memo(FeatureCardComponent);

const featureLayout = [
  {
    icon: Shield,
    titleKey: 'landing.whyChooseUs.features.security.title',
    descriptionKey: 'landing.whyChooseUs.features.security.description',
    gradient: 'from-blue-500 to-cyan-500',
    // Top position (12 o'clock) - increased spacing
    position: 'top-8 left-1/2 -translate-x-1/2 -translate-y-1/2',
  },
  {
    icon: Award,
    titleKey: 'landing.whyChooseUs.features.excellence.title',
    descriptionKey: 'landing.whyChooseUs.features.excellence.description',
    gradient: 'from-purple-500 to-pink-500',
    // Top-right position (2 o'clock)
    position: 'top-[18%] right-0 translate-x-1/3 -translate-y-1/2',
  },
  {
    icon: TrendingUp,
    titleKey: 'landing.whyChooseUs.features.success.title',
    descriptionKey: 'landing.whyChooseUs.features.success.description',
    gradient: 'from-green-500 to-emerald-500',
    // Right position (4 o'clock)
    position: 'bottom-[18%] right-0 translate-x-1/3 translate-y-1/2',
  },
  {
    icon: Users,
    titleKey: 'landing.whyChooseUs.features.support.title',
    descriptionKey: 'landing.whyChooseUs.features.support.description',
    gradient: 'from-orange-500 to-red-500',
    // Bottom position (6 o'clock)
    position: 'bottom-8 left-1/2 -translate-x-1/2 translate-y-1/2',
  },
  {
    icon: Clock,
    titleKey: 'landing.whyChooseUs.features.efficiency.title',
    descriptionKey: 'landing.whyChooseUs.features.efficiency.description',
    gradient: 'from-indigo-500 to-blue-500',
    // Bottom-left position (8 o'clock)
    position: 'bottom-[18%] left-0 -translate-x-1/3 translate-y-1/2',
  },
  {
    icon: Globe,
    titleKey: 'landing.whyChooseUs.features.global.title',
    descriptionKey: 'landing.whyChooseUs.features.global.description',
    gradient: 'from-teal-500 to-cyan-500',
    // Top-left position (10 o'clock)
    position: 'top-[18%] left-0 -translate-x-1/3 -translate-y-1/2',
  },
];

const heroImageBlur =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#0b1a2b"/></svg>'
  );

export function WhyChooseUs() {
  const { t } = useTranslation();
  const localizedFeatures = useMemo(
    () =>
      featureLayout.map((feature) => ({
        ...feature,
        title: t(feature.titleKey),
        description: t(feature.descriptionKey),
      })),
    [t]
  );

  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24 bg-linear-to-b from-slate-50 via-blue-500/30 to-slate-50 dark:from-transparent dark:via-transparent dark:to-transparent">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-linear-to-bl from-primary/15 via-blue-500/15 to-transparent rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-linear-to-tr from-purple-500/15 via-primary/15 to-transparent rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span suppressHydrationWarning>{t('landing.whyChooseUs.title')}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            <span suppressHydrationWarning>{t('landing.whyChooseUs.subtitle')}</span>
          </p>
        </div>

        {/* Circular Layout - Hidden on mobile, grid on small screens, circular on large */}
        <div className="relative pt-12 lg:pt-20 lg:pb-10">
          {/* Mobile/Tablet: Simple Grid Layout */}
          <div className="grid sm:grid-cols-2 lg:hidden gap-3 sm:gap-6 max-w-2xl mx-auto">
            {localizedFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
              />
            ))}
          </div>

          {/* Desktop: Circular Layout Around Image */}
          <div className="hidden lg:block mt-16">
            <div className="relative w-full max-w-5xl mx-auto" style={{ minHeight: '900px' }}>
              {/* Central Image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] xl:w-[500px] xl:h-[500px]">
                {/* Main Image Container */}
                <div className="relative w-full h-full">
                  {/* Glowing Background */}
                  <div className="absolute inset-0 bg-linear-to-tr from-primary/40 via-blue-500/40 to-purple-500/40 rounded-full blur-3xl scale-110 opacity-60 animate-pulse"></div>

                  {/* Image Frame */}
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-primary/30 bg-linear-to-tr from-primary/10 to-blue-500/10">
                    <Image
                      src="/images/patrick image homw.webp"
                      alt={t('landing.whyChooseUs.imageText')}
                      fill
                      className="w-full scale-110 object-cover transition-transform duration-300 hover:scale-110"
                      sizes="500px"
                      placeholder="blur"
                      blurDataURL={heroImageBlur}
                      priority
                    />
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/20 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-blue-600/10 pointer-events-none"></div>
                  </div>

                  {/* Center Badge */}
                  <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                    <div className="group relative flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-full border border-white/60 bg-white/95 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_18px_55px_rgba(0,0,0,0.55)]">
                      <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-primary/20 via-transparent to-blue-500/10 opacity-90 transition-opacity duration-300 group-hover:opacity-100 dark:from-primary/30 dark:via-transparent dark:to-blue-600/20" />
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 dark:text-slate-200">
                        <span suppressHydrationWarning>{t('landing.whyChooseUs.successRate')}</span>
                      </p>
                      <p className="text-5xl font-black text-white/60 transition-colors duration-300 group-hover:text-primary dark:text-white">
                        <span suppressHydrationWarning>{t('landing.hero.successRateValue')}</span>
                      </p>
                      <p className="text-xs font-medium text-white/60 dark:text-slate-300">
                        <span suppressHydrationWarning>{t('landing.hero.clients')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Cards in Circle */}
              {localizedFeatures.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  gradient={feature.gradient}
                  position={feature.position}
                  isDesktop
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
