'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode'); // Firebase reset code from email
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

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

    if (!oobCode) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="mb-4 text-red-600 text-5xl">⚠️</div>
                    <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
                    <p className="text-gray-600 mb-6">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="inline-block py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                    >
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-2">
                    Reset Your Password
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Enter your new password below
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            {...register('confirmPassword')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
