'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
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

type ForgotPasswordSchema = z.ZodObject<{
  email: z.ZodString;
}>;

type ForgotPasswordInput = z.infer<ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const { t } = useTranslation();

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
      await sendPasswordResetEmail(auth, data.email);
      setEmailSent(true);
      toast.success(t('auth.toasts.resetEmailSent'));
    } catch (error) {
      logger.error('Password reset error:', error);
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          toast.error(t('auth.errors.resetEmailUserNotFound'));
        } else {
          toast.error(t('auth.errors.resetEmailFailed'));
        }
      } else {
        toast.error(t('auth.errors.resetEmailFailed'));
      }
    }
  };

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
