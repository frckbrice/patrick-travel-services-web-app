'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Globe, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { values, team } from '@/components/about/api/data';

export const STATS = {
  years: '10+',
  clients: '500+',
  successRate: '94%',
  support: '24/7',
} as const;

export function AboutView() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Stunning Hero Section with Image */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-32 lg:pb-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium shadow-lg border-primary/20"
              >
                <Globe className="h-4 w-4 text-primary" />
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-semibold">
                  {t('about.badge')}
                </span>
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                {t('about.title')}
              </h1>

              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                {t('about.subtitle')}
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-6 md:gap-8 pt-4">
                <div className="space-y-2">
                  <div className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    {STATS.years}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    {t('about.statsYears')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    {STATS.clients}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    {t('about.statsClients')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    {STATS.successRate}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    {t('about.statsSuccess')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Stunning Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative aspect-[4/3]">
                {/* Main Image Container with Advanced Effects */}
                <div className="relative w-full h-full">
                  {/* Glowing Background */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-blue-500/40 to-purple-500/40 rounded-[2.5rem] blur-3xl scale-105 opacity-60 animate-pulse"></div>

                  {/* Image Frame */}
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border-2 border-primary/30 bg-gradient-to-tr from-primary/10 to-blue-500/10">
                    <Image
                      src="/images/mpe_hero_1.jpeg"
                      alt={t('about.imageAlt')}
                      fill
                      className="object-cover scale-105 hover:scale-110 transition-transform duration-700"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 700px"
                    />
                    {/* Multi-layer Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/10"></div>
                  </div>

                  {/* Floating Trust Badge */}
                  <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border-2 border-primary/30 hidden md:block hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                          {t('about.licensedBadge')}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {t('about.licensedSince')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/30 to-blue-500/30 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-blue-600/30 to-purple-500/30 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  {t('about.mission.title')}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-primary to-blue-600 rounded-full"></div>
              </div>

              <div className="space-y-6">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {t('about.mission.paragraph1')}
                </p>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {t('about.mission.paragraph2')}
                </p>
              </div>

              {/* Key Features */}
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{t('about.mission.licensedTitle')}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('about.mission.licensedDesc')}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{t('about.mission.fastTitle')}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('about.mission.fastDesc')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3]">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 rounded-[2rem] blur-2xl"></div>

                {/* Stats Grid Overlay */}
                <div className="relative grid grid-cols-2 gap-4 p-6 rounded-[2rem] bg-card/50 backdrop-blur-sm border-2 border-primary/20 shadow-2xl">
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-extrabold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">
                        {STATS.clients}
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {t('about.mission.statsCases')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                        {STATS.successRate}
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {t('about.mission.statsSuccessRate')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent mb-2">
                        {STATS.years}
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {t('about.mission.statsExperience')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-2">
                        {STATS.support}
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {t('about.mission.statsSupport')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {t('about.values.title')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <CardHeader className="text-center pb-4">
                    <div className="relative mb-6">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      {/* Glow Effect */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${value.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 mx-auto w-16 h-16`}
                      ></div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                      {t(value.titleKey)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(value.descriptionKey)}
                    </p>
                  </CardContent>
                  {/* Hover Effect Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
                  ></div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {t('about.team.title')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="group text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-600 text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {member.avatar}
                    </div>
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 mx-auto w-24 h-24"></div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {t(member.nameKey)}
                  </h3>
                  <Badge variant="secondary" className="mb-4 shadow-sm">
                    {t(member.roleKey)}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(member.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden border-2 border-primary/30 shadow-2xl">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>

            <CardContent className="relative p-8 md:p-12 lg:p-16 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                {t('about.cta.title')}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('about.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-base px-10 h-14 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  asChild
                >
                  <Link href="/register">
                    {t('about.cta.getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-10 h-14 border-2 hover:bg-accent/50 transition-all duration-300"
                  asChild
                >
                  <Link href="/#contact">{t('about.cta.contact')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
