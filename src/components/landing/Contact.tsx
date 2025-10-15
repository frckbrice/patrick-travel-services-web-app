'use client';

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

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
        console.log('Contact form data:', data);
        toast.success(t('landing.contact.success'));
        form.reset();
    };

    const contactInfo = [
        {
            icon: Phone,
            title: t('landing.contact.phone'),
            value: '+1 (234) 567-890',
            href: 'tel:+1234567890',
        },
        {
            icon: Mail,
            title: t('landing.contact.email'),
            value: 'info@patricktravelservices.com',
            href: 'mailto:info@patricktravelservices.com',
        },
        {
            icon: MapPin,
            title: t('landing.contact.address'),
            value: '123 Immigration Street, City, Country',
            href: '#',
        },
    ];

    return (
        <section className="py-20 md:py-32 bg-muted/50">
            <div className="container">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        {t('landing.contact.title')}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.contact.subtitle')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div className="space-y-6">
                        {contactInfo.map((info, index) => {
                            const Icon = info.icon;
                            return (
                                <Card key={index}>
                                    <CardContent className="flex items-start space-x-4 p-6">
                                        <div className="bg-primary/10 p-3 rounded-lg">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{info.title}</h3>
                                            <a
                                                href={info.href}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {info.value}
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Office Hours */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('landing.contact.hours')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('landing.contact.weekdays')}</span>
                                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('landing.contact.saturday')}</span>
                                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('landing.contact.sunday')}</span>
                                    <span className="font-medium">{t('landing.contact.closed')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('landing.contact.formTitle')}</CardTitle>
                            <CardDescription>
                                {t('landing.contact.formSubtitle')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('landing.contact.name')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
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
                                                <FormLabel>{t('landing.contact.emailLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="john@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('landing.contact.phoneLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="tel" placeholder="+1 (234) 567-890" {...field} />
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
                                                <FormLabel>{t('landing.contact.message')}</FormLabel>
                                                <FormControl>
                                                    <textarea
                                                        placeholder={t('landing.contact.messagePlaceholder')}
                                                        className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                        <Send className="mr-2 h-4 w-4" />
                                        {form.formState.isSubmitting ? t('landing.contact.sending') : t('landing.contact.send')}
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

