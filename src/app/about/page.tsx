'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Award, Target, Users, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
    const { t } = useTranslation();

    const values = [
        {
            icon: Award,
            title: 'Excellence',
            description: 'We maintain the highest standards in immigration consulting',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            icon: Heart,
            title: 'Compassion',
            description: 'We understand the personal nature of your journey',
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/20',
        },
        {
            icon: Target,
            title: 'Results',
            description: 'Focused on achieving successful outcomes for every client',
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
        },
        {
            icon: Users,
            title: 'Partnership',
            description: 'Building lasting relationships with our clients',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        },
    ];

    const team = [
        {
            name: 'Patrick Mukendi',
            role: 'Founder & CEO',
            description: 'Licensed immigration consultant with 15+ years of experience',
            avatar: 'PM',
        },
        {
            name: 'Sarah Thompson',
            role: 'Senior Immigration Consultant',
            description: 'Specialist in student and work visas',
            avatar: 'ST',
        },
        {
            name: 'David Chen',
            role: 'Case Manager',
            description: 'Expert in family reunification cases',
            avatar: 'DC',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-muted/10 to-muted/30">
            <Navbar />

            <main className="flex-1 w-full">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center space-y-6 max-w-3xl mx-auto">
                            <Badge variant="outline" className="mb-2">
                                About Us
                            </Badge>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                                Your Trusted Immigration Partner
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground">
                                Helping individuals and families achieve their dreams of living, working, and studying abroad since 2014.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-16 md:py-20">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Card className="border-2">
                            <CardContent className="p-8 md:p-12">
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-6">
                                        <h2 className="text-3xl md:text-4xl font-bold">Our Mission</h2>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            At Patrick Travel Services, we believe everyone deserves the opportunity to pursue their dreams globally.
                                            Our mission is to make immigration accessible, transparent, and successful for all our clients.
                                        </p>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            With over a decade of experience, we've helped hundreds of families navigate complex immigration
                                            processes with confidence and peace of mind.
                                        </p>
                                    </div>
                                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl">
                                        <Image
                                            src="/images/mpe hero 2.png"
                                            alt="Our Team"
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-16 md:py-20">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Our Core Values</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                The principles that guide everything we do
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((value, index) => {
                                const Icon = value.icon;
                                return (
                                    <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className={`w-16 h-16 rounded-2xl ${value.bgColor} flex items-center justify-center mx-auto mb-4`}>
                                                <Icon className={`h-8 w-8 ${value.color}`} />
                                            </div>
                                            <CardTitle className="text-xl">{value.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">
                                                {value.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-16 md:py-20 bg-muted/30">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Meet Our Team</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Experienced professionals dedicated to your success
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {team.map((member, index) => (
                                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-8">
                                        <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                                            {member.avatar}
                                        </div>
                                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                                        <Badge variant="secondary" className="mb-4">
                                            {member.role}
                                        </Badge>
                                        <p className="text-muted-foreground">
                                            {member.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 md:py-20">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
                            <CardContent className="p-12 text-center">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                    Ready to Start Your Journey?
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                                    Let us help you achieve your immigration goals with expert guidance and personalized support.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" asChild>
                                        <Link href="/register">
                                            Get Started Today
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href="/#contact">
                                            Contact Us
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

