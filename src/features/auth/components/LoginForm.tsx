'use client';

// Login form component

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLogin } from '../api/useAuth';
import { loginSchema, LoginInput } from '../schemas/auth.schema';

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const loginMutation = useLogin();
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        await loginMutation.mutateAsync(data);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
                    {t('auth.welcome')} {t('common.back')}
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    {t('auth.signInMessage')}
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.email')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.password')}
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                {...register('rememberMe')}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{t('auth.rememberMe')}</span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || loginMutation.isPending}
                        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loginMutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
                    </button>
                </form>

                {/* Register Link */}
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        {t('auth.signUp')}
                    </Link>
                </p>
            </div>
        </div>
    );
}

