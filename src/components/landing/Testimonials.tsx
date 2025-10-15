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
            role: 'Student Visa',
            content: t('landing.testimonials.testimonial1'),
            rating: 5,
            avatar: 'SJ',
        },
        {
            name: 'Michael Chen',
            role: 'Work Permit',
            content: t('landing.testimonials.testimonial2'),
            rating: 5,
            avatar: 'MC',
        },
        {
            name: 'Emma Williams',
            role: 'Family Reunification',
            content: t('landing.testimonials.testimonial3'),
            rating: 5,
            avatar: 'EW',
        },
    ];

    return (
        <section className="py-20 md:py-32">
            <div className="container">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        {t('landing.testimonials.title')}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.testimonials.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="relative">
                            <CardContent className="pt-6">
                                <Quote className="h-8 w-8 text-primary/20 mb-4" />

                                {/* Rating */}
                                <div className="flex space-x-1 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>

                                {/* Testimonial */}
                                <p className="text-muted-foreground mb-6">
                                    "{testimonial.content}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {testimonial.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

