'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/utils/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/features/auth/store';

type ForgotPasswordSchema = z.ZodObject<{
  email: z.ZodString;
}>;

type ForgotPasswordInput = z.infer<ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect authenticated users away from auth page
  useEffect(() => {
    if (!isLoading && isAuthenticated && !redirecting) {
      setRedirecting(true);
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, redirecting, router]);

  const forgotPasswordSchema = useMemo<ForgotPasswordSchema>(
    () =>
      z.object({
        email: z
          .string()
          .email({ message: t('validation.invalidEmail') })
          .min(1, { message: t('validation.required') }),
      }),
    [t]
  );

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      // Call backend API to generate reset link and send email
      const response = await apiClient.post('/api/auth/forgot-password', {
        email: data.email,
      });

      if (response.data.success) {
        setEmailSent(true);
        toast.success(t('auth.toasts.resetEmailSent') || response.data.message);
      } else {
        throw new Error(response.data.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      logger.error('Password reset error:', error);

      // Handle API errors
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.message) {
        // Backend returns success even if user doesn't exist (for security)
        // So we show success message
        setEmailSent(true);
        toast.success(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('auth.errors.resetEmailFailed'));
      }
    }
  };

  // Show lightweight loader during redirect/auth check
  if (isLoading || redirecting || isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">{t('auth.loading.redirecting')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>{t('auth.checkEmail')}</CardTitle>
            <CardDescription>{t('auth.resetLinkSent')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">{t('auth.backToLogin')}</Link>
            </Button>
            <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
              {t('auth.sendAnotherEmail')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('auth.resetPassword')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.resetPasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('auth.emailPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-primary hover:underline mx-auto">
            {t('auth.backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
