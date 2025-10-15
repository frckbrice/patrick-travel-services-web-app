'use client';

import { useAuthStore } from '@/stores/auth/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function AuditLogsList() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        // Only ADMIN can access this page
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Audit Logs
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Track all system activities and changes
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b dark:border-gray-700">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                </div>
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">No audit logs available</p>
                        <p className="text-sm mt-2">System activities will be logged here</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

