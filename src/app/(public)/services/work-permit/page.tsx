'use client';

import { useTranslation } from 'react-i18next';
import { Briefcase, CheckCircle2, FileText, Clock, Users, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressiveSection } from '@/components/ui/progressive-section';
import Link from 'next/link';

export default function WorkPermitPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: FileText,
      title: 'Complete Documentation',
      description: 'Full support with work permit applications and required documents',
    },
    {
      icon: Clock,
      title: 'Efficient Processing',
      description: 'Streamlined process to get you working faster',
    },
    {
      icon: Users,
      title: 'Expert Advisors',
      description: 'Experienced team specializing in work permit applications',
    },
    {
      icon: Award,
      title: 'High Success Rate',
      description: 'Proven track record of successful work permit approvals',
    },
  ];

  const steps = [
    'Job offer verification and eligibility check',
    'Work permit application preparation',
    'Document submission and processing',
    'Application tracking and updates',
    'Work permit approval and activation',
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
                <div className="p-4 rounded-2xl bg-green-100 dark:bg-green-900/20">
                  <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <Badge className="mb-4" variant="secondary">
                <span suppressHydrationWarning>{t('landing.services.highDemand')}</span>
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                <span suppressHydrationWarning>{t('landing.services.work')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                <span suppressHydrationWarning>{t('landing.services.workDesc')}</span>
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
                Why Choose Our Work Permit Service?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Professional assistance for your international career opportunities
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={`feature-${index}`}
                    className="optimize-rendering border-2 border-green-200 dark:border-green-800"
                  >
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                Step-by-step guidance for your work permit application
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {steps.map((step, index) => (
                <Card key={`step-${index}`} className="optimize-rendering">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
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
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Work Abroad?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Start your international career journey with our expert work permit services.
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
