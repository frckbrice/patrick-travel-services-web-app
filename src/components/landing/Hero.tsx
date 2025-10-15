'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
    const { t } = useTranslation();

    const features = [
        t('landing.hero.feature1'),
        t('landing.hero.feature2'),
        t('landing.hero.feature3'),
    ];

    return (
        <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
            <div className="container">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                                {t('landing.hero.title')}
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl">
                                {t('landing.hero.subtitle')}
                            </p>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-3">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-center space-x-3">
                                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" asChild>
                                <Link href="/register">
                                    {t('landing.hero.cta')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/login">
                                    {t('landing.hero.login')}
                                </Link>
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="pt-8 border-t">
                            <div className="grid grid-cols-3 gap-6 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-primary">500+</div>
                                    <div className="text-sm text-muted-foreground">{t('landing.hero.clients')}</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-primary">94%</div>
                                    <div className="text-sm text-muted-foreground">{t('landing.hero.success')}</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-primary">10+</div>
                                    <div className="text-sm text-muted-foreground">{t('landing.hero.years')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Image/Illustration */}
                    <div className="relative hidden lg:block">
                        <div className="relative h-[600px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="text-8xl">🌍</div>
                                <p className="text-2xl font-semibold">{t('landing.hero.imageText')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

