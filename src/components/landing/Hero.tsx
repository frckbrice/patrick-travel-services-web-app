'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Award, Globe, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressiveSection } from '@/components/ui/progressive-section';

export function Hero() {
  const { t } = useTranslation();

  return (
    <ProgressiveSection
      delay={0}
      duration={1000}
      as="section"
      className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden pt-14 md:pt-16 lg:pt-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
    >
      {/* Full-Width Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{ willChange: 'opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      >
        <Image
          src="/images/mpe_hero_2.jpeg"
          alt={t('landing.hero.imageText')}
          fill
          className="object-cover object-center"
          priority
          quality={90}
          sizes="100vw"
          style={{ opacity: 1 }}
        />
        {/* Reduced Overlay for Better Image Visibility - Theme Aware */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-black/30 dark:from-black/70 dark:via-black/60 dark:to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-blue-600/10" />
      </div>

      {/* Content Container */}
      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 hero-content-visible"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10">
          {/* Trust Badge */}
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-colors"
            >
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t('landing.hero.badge')}</span>
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] sm:leading-[1.15] text-white px-2">
              <span>{t('landing.hero.title')}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed px-2">
              <span>{t('landing.hero.subtitle')}</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-2">
            <Button
              size="lg"
              className="text-sm sm:text-base px-6 sm:px-8 md:px-10 h-12 sm:h-14 shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 group !bg-gradient-to-r !from-blue-600 !to-cyan-600 hover:!from-blue-700 hover:!to-cyan-700 dark:!from-blue-500 dark:!to-cyan-500 dark:hover:!from-blue-600 dark:hover:!to-cyan-600 !text-white hover:!text-white !border-0 will-change-transform w-full sm:w-auto"
              asChild
            >
              <Link href="/register">
                <span>{t('landing.hero.cta')}</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-sm sm:text-base px-6 sm:px-8 md:px-10 h-12 sm:h-14 border-2 border-white/40 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white hover:border-white/60 transition-all duration-200 will-change-transform w-full sm:w-auto"
              asChild
            >
              <Link href="/login">
                <span>{t('landing.hero.login')}</span>
              </Link>
            </Button>
          </div>

          {/* Stats Card - Bottom Centered */}
          <div className="pt-8 sm:pt-12 md:pt-16">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-5 sm:p-6 md:p-8 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 md:gap-8">
                {/* Stat 1 */}
                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-center mb-1">
                    <div className="inline-flex items-center justify-center rounded-full p-2.5 sm:p-3 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shadow-lg bg-white/90 dark:bg-white/80 text-blue-600 dark:text-blue-500 backdrop-blur-sm">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg leading-none">
                    <span>{t('landing.hero.clientsValue')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-sm text-gray-200 dark:text-gray-300 font-medium text-center leading-tight px-1">
                    <span>{t('landing.hero.clients')}</span>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-center mb-1">
                    <div className="inline-flex items-center justify-center rounded-full p-2.5 sm:p-3 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shadow-lg bg-white/90 dark:bg-white/80 text-blue-600 dark:text-blue-500 backdrop-blur-sm">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg leading-none">
                    <span>{t('landing.hero.successRateValue')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-sm text-gray-200 dark:text-gray-300 font-medium text-center leading-tight px-1">
                    <span>{t('landing.hero.success')}</span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-center mb-1">
                    <div className="inline-flex items-center justify-center rounded-full p-2.5 sm:p-3 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shadow-lg bg-white/90 dark:bg-white/80 text-blue-600 dark:text-blue-500 backdrop-blur-sm">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg leading-none">
                    <span>{t('landing.hero.experienceValue')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-sm text-gray-200 dark:text-gray-300 font-medium text-center leading-tight px-1">
                    <span>{t('landing.hero.years')}</span>
                  </div>
                </div>

                {/* Stat 4 - Countries */}
                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-center mb-1">
                    <div className="inline-flex items-center justify-center rounded-full p-2.5 sm:p-3 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shadow-lg bg-white/90 dark:bg-white/80 text-blue-600 dark:text-blue-500 backdrop-blur-sm">
                      <Globe className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg leading-none">
                    <span>{t('landing.hero.countriesServedValue')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-sm text-gray-200 dark:text-gray-300 font-medium text-center leading-tight px-1">
                    <span>{t('landing.hero.countriesServed')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Optional */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full p-1">
          <div className="w-1.5 h-3 bg-white rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    </ProgressiveSection>
  );
}
