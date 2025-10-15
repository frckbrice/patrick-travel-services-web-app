'use client';

// Login form component with shadcn/ui

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../api/useAuth';
import { loginSchema, LoginInput } from '../schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const loginMutation = useLogin();
    const { t } = useTranslation();

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = async (data: LoginInput) => {
        await loginMutation.mutateAsync(data);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        {t('auth.welcome')} {t('common.back')}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {t('auth.signInMessage')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('auth.email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password */}
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
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <FormField
                                    control={form.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="rounded border-input text-primary focus:ring-primary"
                                                />
                                            </FormControl>
                                            <Label className="text-sm font-normal cursor-pointer">
                                                {t('auth.rememberMe')}
                                            </Label>
                                        </FormItem>
                                    )}
                                />
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t('auth.forgotPassword')}
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.formState.isSubmitting || loginMutation.isPending}
                            >
                                {loginMutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-center text-muted-foreground w-full">
                        {t('auth.dontHaveAccount')}{' '}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            {t('auth.signUp')}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
