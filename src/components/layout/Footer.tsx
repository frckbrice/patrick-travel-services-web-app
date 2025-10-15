'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    const services = [
        { name: t('landing.services.student'), href: '/services/student-visa' },
        { name: t('landing.services.work'), href: '/services/work-permit' },
        { name: t('landing.services.family'), href: '/services/family-reunification' },
        { name: t('landing.services.business'), href: '/services/business-visa' },
    ];

    const company = [
        { name: t('landing.footer.about'), href: '/about' },
        { name: t('landing.footer.team'), href: '/team' },
        { name: t('landing.footer.careers'), href: '/careers' },
        { name: t('landing.footer.press'), href: '/press' },
    ];

    const legal = [
        { name: t('landing.footer.privacy'), href: '/privacy' },
        { name: t('landing.footer.terms'), href: '/terms' },
        { name: t('landing.footer.cookies'), href: '/cookies' },
    ];

    const socialLinks = [
        { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
        { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
        { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
        { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    ];

    return (
        <footer className="bg-background border-t w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Company Info */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <Image
                                src="/images/app-logo.png"
                                alt="Patrick Travel Services"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                            <span className="font-bold text-lg text-primary">
                                Patrick Travel Services
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            {t('landing.footer.description')}
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <a href="mailto:info@patricktravelservices.com" className="hover:text-primary">
                                    info@patricktravelservices.com
                                </a>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <a href="tel:+1234567890" className="hover:text-primary">
                                    +1 (234) 567-890
                                </a>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>123 Immigration Street, City, Country</span>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-semibold mb-4">{t('landing.footer.services')}</h3>
                        <ul className="space-y-2">
                            {services.map((service) => (
                                <li key={service.name}>
                                    <Link
                                        href={service.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {service.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold mb-4">{t('landing.footer.company')}</h3>
                        <ul className="space-y-2">
                            {company.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold mb-4">{t('landing.footer.legal')}</h3>
                        <ul className="space-y-2">
                            {legal.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} Patrick Travel Services. {t('landing.footer.rights')}
                    </p>
                    <div className="flex space-x-4">
                        {socialLinks.map((social) => {
                            const Icon = social.icon;
                            return (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                    aria-label={social.label}
                                >
                                    <Icon className="h-5 w-5" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}

