'use client';

import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Testimonials() {
    const { t } = useTranslation();

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: t('landing.testimonials.role1'),
            location: t('landing.testimonials.location1'),
            content: t('landing.testimonials.testimonial1'),
            rating: 5,
            avatar: 'SJ',
            color: 'bg-blue-600',
        },
        {
            name: 'Michael Chen',
            role: t('landing.testimonials.role2'),
            location: t('landing.testimonials.location2'),
            content: t('landing.testimonials.testimonial2'),
            rating: 5,
            avatar: 'MC',
            color: 'bg-green-600',
        },
        {
            name: 'Emma Williams',
            role: t('landing.testimonials.role3'),
            location: t('landing.testimonials.location3'),
            content: t('landing.testimonials.testimonial3'),
            rating: 5,
            avatar: 'EW',
            color: 'bg-purple-600',
        },
    ];

    return (
        <section className="relative py-16 md:py-20 lg:py-24">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('landing.testimonials.title')}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        {t('landing.testimonials.subtitle')}
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2">
                            {/* Background Gradient */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl"></div>

                            <CardContent className="pt-8 relative">
                                {/* Quote Icon */}
                                <Quote className="h-12 w-12 text-primary/20 mb-4" />

                                {/* Rating */}
                                <div className="flex space-x-1 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-label="star" />
                                    ))}
                                </div>

                                {/* Testimonial Content */}
                                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                                    &ldquo;{testimonial.content}&rdquo;
                                </p>

                                {/* Author Info */}
                                <div className="flex items-center space-x-4 pt-4 border-t">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className={`${testimonial.color} text-white text-lg font-semibold`}>
                                            {testimonial.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-base">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Trust Badge */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center space-x-2 bg-muted px-6 py-3 rounded-full">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                        <span className="font-semibold">4.9/5.0</span>
                        <span className="text-muted-foreground">{t('landing.testimonials.rating')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
