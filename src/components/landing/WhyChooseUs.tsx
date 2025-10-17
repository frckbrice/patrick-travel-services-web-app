'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Shield, Award, Users, TrendingUp, Clock, Globe, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
    icon: LucideIcon;
    titleKey: string;
    descriptionKey: string;
    gradient: string;
    position?: string;
    isDesktop?: boolean;
}

function FeatureCard({ icon: Icon, titleKey, descriptionKey, gradient, position, isDesktop }: FeatureCardProps) {
    const { t } = useTranslation();

    return (
        <Card
            className={`group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl ${isDesktop
                ? `absolute w-56 ${position} hover:scale-105 z-20 bg-card/95 backdrop-blur-sm`
                : 'hover:-translate-y-1'
                }`}
        >
            <CardContent className="p-5 space-y-3">
                {/* Icon */}
                <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                </div>

                {/* Content */}
                <div className={isDesktop ? 'space-y-2' : 'space-y-1'}>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors duration-300">
                        {t(titleKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t(descriptionKey)}
                    </p>
                </div>

                {/* Hover Effect Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </CardContent>
        </Card>
    );
}

const features = [
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

export function WhyChooseUs() {
    const { t } = useTranslation();

    return (
        <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/15 via-blue-500/15 to-transparent rounded-full blur-3xl opacity-40"></div>
                <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 via-primary/15 to-transparent rounded-full blur-3xl opacity-40"></div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16 lg:mb-20">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('landing.whyChooseUs.title')}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        {t('landing.whyChooseUs.subtitle')}
                    </p>
                </div>

                {/* Circular Layout - Hidden on mobile, grid on small screens, circular on large */}
                <div className="relative pt-12 lg:pt-20 lg:pb-10">
                    {/* Mobile/Tablet: Simple Grid Layout */}
                    <div className="grid sm:grid-cols-2 lg:hidden gap-6 max-w-2xl mx-auto">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={index}
                                icon={feature.icon}
                                titleKey={feature.titleKey}
                                descriptionKey={feature.descriptionKey}
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
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-blue-500/40 to-purple-500/40 rounded-full blur-3xl scale-110 opacity-60 animate-pulse"></div>

                                    {/* Image Frame */}
                                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-primary/30 bg-gradient-to-tr from-primary/10 to-blue-500/10">
                                        <Image
                                            src="/images/mpe_hero_3.png"
                                            alt={t('landing.whyChooseUs.imageText')}
                                            fill
                                            className="object-cover scale-110 w-full hover:scale-125 transition-transform duration-700"
                                            sizes="500px"
                                        />
                                        {/* Gradient Overlays */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20"></div>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-600/10"></div>
                                    </div>

                                    {/* Center Badge */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-2xl rounded-full p-8 shadow-2xl border-4 border-primary/40 z-10">
                                        <div className="text-center">
                                            <div className="text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent mb-2">
                                                {t('landing.hero.successRateValue')}
                                            </div>
                                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                                                {t('landing.whyChooseUs.successRate')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Cards in Circle */}
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={index}
                                    icon={feature.icon}
                                    titleKey={feature.titleKey}
                                    descriptionKey={feature.descriptionKey}
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

