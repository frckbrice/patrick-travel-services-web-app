'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [emailSent, setEmailSent] = useState(false);
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        try {
            await sendPasswordResetEmail(auth, data.email);
            setEmailSent(true);
            toast.success('Password reset email sent! Please check your inbox.');
            logger.info('Password reset email sent', { email: data.email });
        } catch (error: any) {
            logger.error('Forgot password error', error);

            if (error.code === 'auth/user-not-found') {
                toast.error('No account found with this email address.');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Too many requests. Please try again later.');
            } else {
                toast.error('Failed to send reset email. Please try again.');
            }
        }
    };

    if (emailSent) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                    <div className="mb-4 text-green-600 text-5xl">✓</div>
                    <h2 className="text-2xl font-bold mb-4 dark:text-white">{t('auth.checkEmail')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t('auth.resetLinkSent')}
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/login"
                            className="block w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 text-center"
                        >
                            {t('auth.backToLogin')}
                        </Link>
                        <button
                            onClick={() => setEmailSent(false)}
                            className="block w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 text-center"
                        >
                            Send Another Email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-2">
                    Forgot Password?
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

