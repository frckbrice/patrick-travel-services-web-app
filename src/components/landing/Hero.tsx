'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Award, Globe, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Full-Width Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/mpe_hero_2.jpeg"
          alt={t('landing.hero.imageText')}
          fill
          className="object-cover object-center"
          priority
          quality={90}
          sizes="100vw"
        />
        {/* Reduced Overlay for Better Image Visibility - Theme Aware */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-black/30 dark:from-black/70 dark:via-black/60 dark:to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-blue-600/10" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 md:space-y-10">
          {/* Trust Badge */}
          <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-colors"
            >
              <Award className="h-4 w-4" />
              <span suppressHydrationWarning>{t('landing.hero.badge')}</span>
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white">
              <span suppressHydrationWarning>{t('landing.hero.title')}</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              <span suppressHydrationWarning>{t('landing.hero.subtitle')}</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <Button
              size="lg"
              className="text-base px-10 h-14 shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 group !bg-gradient-to-r !from-blue-600 !to-cyan-600 hover:!from-blue-700 hover:!to-cyan-700 dark:!from-blue-500 dark:!to-cyan-500 dark:hover:!from-blue-600 dark:hover:!to-cyan-600 !text-white hover:!text-white !border-0 will-change-transform"
              asChild
            >
              <Link href="/register">
                <span suppressHydrationWarning>{t('landing.hero.cta')}</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-10 h-14 border-2 border-white/40 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white hover:border-white/60 transition-all duration-200 will-change-transform"
              asChild
            >
              <Link href="/login">
                <span suppressHydrationWarning>{t('landing.hero.login')}</span>
              </Link>
            </Button>
          </div>

          {/* Stats Card - Bottom Centered */}
          <div className="pt-12 md:pt-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl border border-white/30 p-6 md:p-8 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {/* Stat 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    500+
                  </div>
                  <div className="text-xs md:text-sm text-gray-300 font-medium">
                    <span suppressHydrationWarning>{t('landing.hero.clients')}</span>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    94%
                  </div>
                  <div className="text-xs md:text-sm text-gray-300 font-medium">
                    <span suppressHydrationWarning>{t('landing.hero.success')}</span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    10+
                  </div>
                  <div className="text-xs md:text-sm text-gray-300 font-medium">
                    <span suppressHydrationWarning>{t('landing.hero.years')}</span>
                  </div>
                </div>

                {/* Stat 4 - Countries */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-center mb-2">
                    <Globe className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    50+
                  </div>
                  <div
                    className="text-xs md:text-sm text-gray-300 font-medium"
                    suppressHydrationWarning
                  >
                    Countries Served
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
    </section>
  );
}
