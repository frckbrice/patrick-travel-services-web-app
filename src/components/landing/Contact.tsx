'use client';

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/utils/axios';
import { AxiosError } from 'axios';
import { contactInfo } from './api/data';
import { hashPII } from '@/lib/utils/pii-hash';

export function Contact() {
  const { t } = useTranslation();

  const contactSchema = z.object({
    name: z.string().min(2, t('landing.contact.validation.nameMin')),
    email: z.string().email(t('landing.contact.validation.emailInvalid')),
    phone: z.string().optional(),
    message: z.string().min(10, t('landing.contact.validation.messageMin')),
  });

  type ContactInput = z.infer<typeof contactSchema>;

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
    try {
      // Log without PII - only hash identifiers for privacy
      logger.info('Submitting contact form', {
        emailHash: hashPII(data.email),
        nameHash: hashPII(data.name),
      });

      // Submit to contact API endpoint
      const response = await apiClient.post('/api/contact', data);

      logger.info('Contact form submitted successfully', {
        contactId: response.data.data?.id,
      });

      // Show success message
      toast.success(response.data.data?.message || t('landing.contact.success'));

      // Reset form only on success
      form.reset();
    } catch (error) {
      // Handle errors
      logger.error('Contact form submission failed', error);

      let errorMessage =
        t('landing.contact.error') || 'Failed to submit contact form. Please try again.';

      if (error instanceof AxiosError) {
        // Extract error message from API response
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 429) {
          errorMessage = t('landing.contact.error_too_many_requests');
        } else if (error.response && error.response.status >= 500) {
          errorMessage = t('landing.contact.error_server');
        } else if (!error.response) {
          errorMessage = t('landing.contact.error_network');
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <section className="relative py-16 md:py-20 lg:py-24 bg-gradient-to-b from-purple-200/20 via-emerald-200/20 to-teal-50/30 dark:from-transparent dark:via-transparent dark:to-transparent">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span suppressHydrationWarning>{t('landing.contact.title')}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            <span suppressHydrationWarning>{t('landing.contact.subtitle')}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Contact Information - Left Side */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-6">
            {/* Contact Cards */}
            {contactInfo(t).map((info, index) => {
              const Icon = info.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow duration-200 border-2"
                >
                  <CardContent className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6">
                    <div
                      className={`${info.bgColor} p-2.5 sm:p-4 rounded-lg sm:rounded-xl flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${info.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-lg leading-tight">
                        <span suppressHydrationWarning>{info.title}</span>
                      </h3>
                      <a
                        href={info.href}
                        className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm break-words"
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
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">
                    <span suppressHydrationWarning>{t('landing.contact.hours')}</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-background rounded-lg">
                  <span
                    className="text-muted-foreground font-medium text-xs sm:text-sm"
                    suppressHydrationWarning
                  >
                    {t('landing.contact.weekdays')}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1"
                  >
                    9:00 AM - 6:00 PM
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-background rounded-lg">
                  <span
                    className="text-muted-foreground font-medium text-xs sm:text-sm"
                    suppressHydrationWarning
                  >
                    {t('landing.contact.saturday')}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1"
                  >
                    10:00 AM - 4:00 PM
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-background rounded-lg">
                  <span
                    className="text-muted-foreground font-medium text-xs sm:text-sm"
                    suppressHydrationWarning
                  >
                    {t('landing.contact.sunday')}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1"
                  >
                    <span suppressHydrationWarning>{t('landing.contact.closed')}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form - Right Side */}
          <Card className="lg:col-span-3 border-2 shadow-xl">
            <CardHeader className="pb-4 sm:pb-6 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">
                <span suppressHydrationWarning>{t('landing.contact.formTitle')}</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                <span suppressHydrationWarning>{t('landing.contact.formSubtitle')}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            <span suppressHydrationWarning>{t('landing.contact.name')}</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="franck brice"
                              className="h-10 sm:h-12 text-sm sm:text-base"
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
                          <FormLabel className="text-sm sm:text-base">
                            <span suppressHydrationWarning>{t('landing.contact.emailLabel')}</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              className="h-10 sm:h-12 text-sm sm:text-base"
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
                        <FormLabel className="text-sm sm:text-base">
                          <span suppressHydrationWarning>{t('landing.contact.phoneLabel')}</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (234) 567-890"
                            className="h-10 sm:h-12 text-sm sm:text-base"
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
                        <FormLabel className="text-sm sm:text-base">
                          <span suppressHydrationWarning>{t('landing.contact.message')}</span>
                        </FormLabel>
                        <FormControl>
                          <textarea
                            placeholder={t('landing.contact.messagePlaceholder')}
                            className="w-full min-h-[120px] sm:min-h-[160px] px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-12 text-sm sm:text-base"
                    size="lg"
                    disabled={form.formState.isSubmitting}
                  >
                    <span suppressHydrationWarning>
                      {form.formState.isSubmitting ? (
                        t('landing.contact.sending')
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          {t('landing.contact.send')}
                        </>
                      )}
                    </span>
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
