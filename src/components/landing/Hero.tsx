'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-4 pb-16 md:pt-8 md:pb-20 lg:pt-16 lg:pb-24">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-blue-500/20 to-transparent rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-primary/20 to-transparent rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            {/* Trust Badge */}
            <div className="inline-flex justify-center lg:justify-start">
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium shadow-lg border-primary/20"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 motion-reduce:animate-none"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-semibold">
                  {t('landing.hero.badge')}
                </span>
              </Badge>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                {t('landing.hero.subtitle')}
              </p>
            </div>

            {/* Key Features - Enhanced */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2.5 text-sm md:text-base">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium">{t('landing.hero.features.expertGuidance')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm md:text-base">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium">{t('landing.hero.features.realTimeTracking')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm md:text-base">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium">{t('landing.hero.features.successRate')}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button
                size="lg"
                className="text-base px-10 h-14 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                asChild
              >
                <Link href="/register">
                  {t('landing.hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-10 h-14 border-2 hover:bg-accent/50 transition-all duration-300"
                asChild
              >
                <Link href="/login">{t('landing.hero.login')}</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8">
              <div className="grid grid-cols-3 gap-8 md:gap-12">
                <div className="space-y-2">
                  <div className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    500+
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    {t('landing.hero.clients')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    94%
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    {t('landing.hero.success')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    10+
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    {t('landing.hero.years')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stunning Hero Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-[4/3] lg:aspect-[3/4]">
              {/* Main Image Container with Advanced Effects */}
              <div className="relative w-full h-full">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-blue-500/30 to-purple-500/30 rounded-[2.5rem] blur-3xl scale-105 opacity-50"></div>

                {/* Image Frame */}
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
                  <Image
                    src="/images/mpe_hero_2.jpeg"
                    alt={t('landing.hero.imageText')}
                    fill
                    className="object-contain scale-105 hover:scale-110 transition-transform duration-700"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 700px"
                  />
                  {/* Multi-layer Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/10"></div>
                </div>
              </div>

              {/* Enhanced Floating Stats Card */}
              <div className="absolute -bottom-8 -left-8 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border-2 border-primary/30 hidden lg:block hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      {t('landing.hero.successRateValue')}
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      {t('landing.hero.successRate')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Badge */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-primary to-blue-600 text-primary-foreground px-6 py-3 rounded-full shadow-2xl border-4 border-background font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform duration-300">
                {t('landing.hero.trustedBy', { count: 500 })}
              </div>

              {/* Enhanced Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/30 to-blue-500/30 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-blue-600/30 to-purple-500/30 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
