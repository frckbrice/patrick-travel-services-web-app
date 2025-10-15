'use client';

import { useAuthStore } from '@/stores/auth/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function AnalyticsView() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        // Only ADMIN and AGENT can access this page
        if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user && !['ADMIN', 'AGENT'].includes(user.role)) {
        return null;
    }

    const stats = [
        { label: 'Total Cases', value: '156', trend: '+12%' },
        { label: 'Active Cases', value: '48', trend: '+8%' },
        { label: 'Approved Cases', value: '92', trend: '+15%' },
        { label: 'Success Rate', value: '94%', trend: '+3%' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Analytics
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Track performance and case statistics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">{stat.trend}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Cases by Status</h2>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Chart placeholder - integrate Recharts
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Monthly Trends</h2>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Chart placeholder - integrate Recharts
                    </div>
                </div>
            </div>
        </div>
    );
}

