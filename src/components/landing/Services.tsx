'use client';

import { useTranslation } from 'react-i18next';
import { GraduationCap, Briefcase, Users, Plane } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Services() {
    const { t } = useTranslation();

    const services = [
        {
            icon: GraduationCap,
            title: t('landing.services.student'),
            description: t('landing.services.studentDesc'),
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            icon: Briefcase,
            title: t('landing.services.work'),
            description: t('landing.services.workDesc'),
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
        },
        {
            icon: Users,
            title: t('landing.services.family'),
            description: t('landing.services.familyDesc'),
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        },
        {
            icon: Plane,
            title: t('landing.services.business'),
            description: t('landing.services.businessDesc'),
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        },
    ];

    return (
        <section className="py-20 md:py-32 bg-muted/50">
            <div className="container">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        {t('landing.services.title')}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.services.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg ${service.bgColor} flex items-center justify-center mb-4`}>
                                        <Icon className={`h-6 w-6 ${service.color}`} />
                                    </div>
                                    <CardTitle>{service.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {service.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <Button size="lg" variant="outline">
                        {t('landing.services.viewAll')}
                    </Button>
                </div>
            </div>
        </section>
    );
}

