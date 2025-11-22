'use client';

// Registration form component with shadcn/ui
// SESSION AWARE: Redirects if already logged in

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Ticket,
  FileText,
  Shield,
} from 'lucide-react';
import { useRegister, useGoogleSignIn } from '../api/useAuth';
import { useAuthStore } from '../store';
import { registerSchema, RegisterInput } from '../schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  FormDescription,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const registerMutation = useRegister();
  const googleSignInMutation = useGoogleSignIn();
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Always call useForm (hooks must be called in same order every render)
  const form = useForm<RegisterInput>({
    // Cast to align with react-hook-form Resolver typing and avoid TFieldValues mismatches
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      street: '',
      city: '',
      country: '',
      inviteCode: '',
      acceptedTerms: false,
      acceptedPrivacy: false,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated && !redirecting) {
      setRedirecting(true);
      router.replace('/dashboard');
    }
  }, [mounted, isLoading, isAuthenticated, redirecting, router]);

  const handleGoogleSignIn = async () => {
    try {
      await googleSignInMutation.mutateAsync();
      // Redirect handled in mutation's onSuccess
    } catch {
      // Error is already handled by the mutation's onError callback
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    try {
      // Add GDPR consent timestamp
      const registrationData = {
        ...data,
        consentedAt: new Date().toISOString(),
      };
      await registerMutation.mutateAsync(registrationData);
      // Redirect handled in mutation's onSuccess
    } catch {
      // Error is handled by mutation's onError
    }
  };

  // Show loading while checking session or hydrating
  if (!mounted || isLoading || redirecting || isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">
              {isLoading ? t('auth.loading.authenticating') : t('auth.loading.redirecting')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthLoading = registerMutation.isPending || googleSignInMutation.isPending;

  return (
    <>
      {/* Enhanced Loading Overlay */}
      <AuthLoadingOverlay
        isLoading={isAuthLoading}
        isSuccess={isAuthenticated}
        steps={{
          authenticating: t('auth.loading.creatingAccount'),
          settingUp: t('auth.loading.settingUpProfile'),
          redirecting: t('auth.loading.redirectingWelcome'),
        }}
      />

      <div className="w-full max-w-2xl mx-auto">
        <Card className="shadow-xl border-2 bg-background/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('auth.createAccount')}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {t('auth.signUpMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-base font-medium border-2 hover:bg-accent/50 transition-all duration-200 shadow-sm"
              onClick={handleGoogleSignIn}
              disabled={googleSignInMutation.isPending}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              {googleSignInMutation.isPending ? t('auth.signingIn') : t('auth.continueWithGoogle')}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-card px-3 py-1 text-muted-foreground font-medium">
                  {t('auth.orContinueWithEmail')}
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {t('auth.personalInfo') || 'Personal Information'}
                    </h3>
                  </div>

                  {/* Name Fields - Grid Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {t('auth.firstName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('auth.placeholders.firstName')}
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {t('auth.lastName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('auth.placeholders.lastName')}
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {t('auth.email')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone (Optional) */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {t('auth.phone')}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            ({t('auth.optional') || 'Optional'})
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder={t('auth.placeholders.phone')}
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {t('auth.address') || 'Address'}
                      <span className="text-xs font-normal text-muted-foreground ml-2 lowercase">
                        ({t('auth.optional') || 'Optional'})
                      </span>
                    </h3>
                  </div>

                  {/* Street */}
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t('auth.address.street')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('auth.placeholders.street')}
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City and Country - Grid Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t('auth.address.city')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('auth.placeholders.city')}
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t('auth.address.country')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('auth.placeholders.country')}
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Security Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <Lock className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {t('auth.security') || 'Security'}
                    </h3>
                  </div>

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {t('auth.password')}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-10 h-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                              tabIndex={-1}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t('auth.passwordRequirements') ||
                            'Must be at least 8 characters with uppercase, lowercase, and number'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Invite Code (Optional - for AGENT/ADMIN roles) */}
                  <FormField
                    control={form.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          {t('auth.inviteCode.label')}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            ({t('auth.inviteCode.subLabel') || 'Optional'})
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('auth.inviteCode.placeholder')}
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t('auth.inviteCode.helper')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* GDPR Consent Section */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 pb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {t('auth.privacy.title')}
                    </p>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <FormField
                    control={form.control}
                    name="acceptedTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border/50 p-3 bg-accent/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {t('auth.privacy.acceptTermsPrefix')}{' '}
                            <Link
                              href="/terms"
                              target="_blank"
                              className="text-primary hover:underline font-medium transition-colors"
                            >
                              {t('auth.privacy.termsLabel')}
                            </Link>
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormMessage className="text-xs" />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Privacy Policy Checkbox */}
                  <FormField
                    control={form.control}
                    name="acceptedPrivacy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border/50 p-3 bg-accent/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {t('auth.privacy.acceptPrivacyPrefix')}{' '}
                            <Link
                              href="/privacy"
                              target="_blank"
                              className="text-primary hover:underline font-medium transition-colors"
                            >
                              {t('auth.privacy.privacyLabel')}
                            </Link>
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormMessage className="text-xs" />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormDescription className="text-xs text-muted-foreground pl-1">
                    {t('auth.privacy.notice')}
                  </FormDescription>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={form.formState.isSubmitting || registerMutation.isPending}
                >
                  {registerMutation.isPending ? t('auth.signingUp') : t('auth.createAccount')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="pt-6 border-t border-border/50">
            <p className="text-sm text-center text-muted-foreground w-full">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold transition-colors"
              >
                {t('auth.signIn')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
