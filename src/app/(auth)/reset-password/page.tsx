'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { confirmPasswordReset } from 'firebase/auth';
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
import { useAuthStore } from '@/features/auth/store';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode'); // Firebase reset code from email
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect authenticated users away from auth page
  useEffect(() => {
    // IMPORTANT: If a valid reset code is present, allow resetting even if authenticated
    if (!oobCode && !isLoading && isAuthenticated && !redirecting) {
      setRedirecting(true);
      router.replace('/dashboard');
    }
  }, [oobCode, isLoading, isAuthenticated, redirecting, router]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!oobCode) {
      toast.error('Invalid or expired reset link');
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast.success('Password reset successful! You can now log in.');
      logger.info('Password reset successful');
      router.push('/login');
    } catch (error: any) {
      logger.error('Reset password error', error);

      if (error.code === 'auth/expired-action-code') {
        toast.error('Reset link has expired. Please request a new one.');
      } else if (error.code === 'auth/invalid-action-code') {
        toast.error('Invalid reset link. Please request a new one.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use a stronger password.');
      } else {
        toast.error('Failed to reset password. Please try again.');
      }
    }
  };

  // Show loader during redirect/auth check
  if (!oobCode && (isLoading || redirecting || isAuthenticated)) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground" suppressHydrationWarning>
              {t('auth.loading.redirecting')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!oobCode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="mb-4 text-red-600 dark:text-red-400 text-5xl">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">{t('auth.invalidResetLink')}</h2>
            <p className="text-muted-foreground mb-6">{t('auth.invalidResetLinkDescription')}</p>
            <Button asChild>
              <Link href="/forgot-password">{t('auth.requestNewResetLink')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('auth.resetPassword')}</CardTitle>
          <CardDescription className="text-center">{t('auth.enterNewPassword')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('auth.resetting') : t('auth.resetPassword')}
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

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground" suppressHydrationWarning>
            {t('common.loading')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
