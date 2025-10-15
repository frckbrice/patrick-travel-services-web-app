'use client';

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactInput = z.infer<typeof contactSchema>;

export function Contact() {
    const { t } = useTranslation();

    const form = useForm<ContactInput>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            message: '',
        },
    });

    const onSubmit = async (data: ContactInput) => {
        // TODO: Implement actual form submission
        logger.info('Contact form data:', data);
        toast.success(t('landing.contact.success'));
        form.reset();
    };

    const contactInfo = [
        {
            icon: Phone,
            title: t('landing.contact.phone'),
            value: '+1 (234) 567-890',
            href: 'tel:+1234567890',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
        },
        {
            icon: Mail,
            title: t('landing.contact.email'),
            value: 'info@patricktravelservices.com',
            href: 'mailto:info@patricktravelservices.com',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            icon: MapPin,
            title: t('landing.contact.address'),
            value: '123 Immigration Street, City, Country',
            href: '#',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        },
    ];

    return (
        <section className="relative py-16 md:py-20 lg:py-24">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('landing.contact.title')}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        {t('landing.contact.subtitle')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
                    {/* Contact Information - Left Side */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Cards */}
                        {contactInfo.map((info, index) => {
                            const Icon = info.icon;
                            return (
                                <Card key={index} className="hover:shadow-lg transition-shadow border-2">
                                    <CardContent className="flex items-start space-x-4 p-6">
                                        <div className={`${info.bgColor} p-4 rounded-xl`}>
                                            <Icon className={`h-6 w-6 ${info.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-2 text-lg">{info.title}</h3>
                                            <a
                                                href={info.href}
                                                className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                            >
                                                {info.value}
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Office Hours */}
                        <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">{t('landing.contact.hours')}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                                    <span className="text-muted-foreground font-medium">{t('landing.contact.weekdays')}</span>
                                    <Badge variant="secondary">9:00 AM - 6:00 PM</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                                    <span className="text-muted-foreground font-medium">{t('landing.contact.saturday')}</span>
                                    <Badge variant="secondary">10:00 AM - 4:00 PM</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                                    <span className="text-muted-foreground font-medium">{t('landing.contact.sunday')}</span>
                                    <Badge variant="outline">{t('landing.contact.closed')}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form - Right Side */}
                    <Card className="lg:col-span-3 border-2 shadow-xl">
                        <CardHeader className="pb-6">
                            <CardTitle className="text-2xl">{t('landing.contact.formTitle')}</CardTitle>
                            <CardDescription className="text-base">
                                {t('landing.contact.formSubtitle')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">{t('landing.contact.name')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="John Doe"
                                                            className="h-12"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">{t('landing.contact.emailLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="john@example.com"
                                                            className="h-12"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">{t('landing.contact.phoneLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        placeholder="+1 (234) 567-890"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">{t('landing.contact.message')}</FormLabel>
                                                <FormControl>
                                                    <textarea
                                                        placeholder={t('landing.contact.messagePlaceholder')}
                                                        className="w-full min-h-[160px] px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base"
                                        size="lg"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting ? (
                                            t('landing.contact.sending')
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-5 w-5" />
                                                {t('landing.contact.send')}
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
