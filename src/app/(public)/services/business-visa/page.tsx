'use client';

import { useTranslation } from 'react-i18next';
import { Plane, CheckCircle2, FileText, Clock, Briefcase, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressiveSection } from '@/components/ui/progressive-section';
import Link from 'next/link';

export default function BusinessVisaPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: FileText,
      title: 'Business Documentation',
      description: 'Complete support for business visa applications and requirements',
    },
    {
      icon: Clock,
      title: 'Fast Track Processing',
      description: 'Expedited processing for urgent business travel needs',
    },
    {
      icon: Briefcase,
      title: 'Business Expertise',
      description: 'Specialized knowledge in business immigration requirements',
    },
    {
      icon: Award,
      title: 'Reliable Service',
      description: 'Trusted by businesses for their immigration needs',
    },
  ];

  const steps = [
    'Business purpose verification and eligibility',
    'Business visa application preparation',
    'Document compilation and submission',
    'Application processing and monitoring',
    'Business visa approval and travel support',
  ];

  return (
    <>
      {/* Clean white background for light mode */}
      <div className="fixed inset-0 -z-10 bg-white dark:bg-gray-950" />
      <div className="flex flex-col w-full bg-white dark:bg-gray-950">
        {/* Hero Section */}
        <ProgressiveSection
          delay={0}
          duration={800}
          as="section"
          className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-transparent"
        >
          <div
            className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hero-content-visible"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-orange-100 dark:bg-orange-900/20">
                  <Plane className="h-12 w-12 sm:h-16 sm:w-16 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                <span suppressHydrationWarning>{t('landing.services.business')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                <span suppressHydrationWarning>{t('landing.services.businessDesc')}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </ProgressiveSection>

        {/* Features Section */}
        <ProgressiveSection
          delay={200}
          duration={800}
          as="section"
          className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-transparent"
        >
          <div
            className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hero-content-visible"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Why Choose Our Business Visa Service?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Professional support for your business travel and immigration needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={`feature-${index}`}
                    className="optimize-rendering border-2 border-orange-200 dark:border-orange-800"
                  >
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </ProgressiveSection>

        {/* Process Section */}
        <ProgressiveSection
          delay={300}
          duration={800}
          as="section"
          className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-transparent"
        >
          <div
            className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hero-content-visible"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Our Process
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Streamlined process for business visa applications
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {steps.map((step, index) => (
                <Card key={`step-${index}`} className="optimize-rendering">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="text-base sm:text-lg pt-2">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ProgressiveSection>

        {/* CTA Section */}
        <ProgressiveSection
          delay={400}
          duration={800}
          as="section"
          className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-transparent"
        >
          <div
            className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hero-content-visible"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <Card className="border-2 border-primary/30 optimize-rendering">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready for Business Travel?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Streamline your business immigration needs with our expert business visa services.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/register">Get Started Today</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/contact">Schedule Consultation</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ProgressiveSection>
      </div>
    </>
  );
}
