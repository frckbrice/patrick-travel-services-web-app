'use client';

import { useAuthStore } from '@/stores/auth/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

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
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="mt-2 text-gray-600">
                    Track performance and case statistics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                    >
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="mt-2 text-sm text-green-600">{stat.trend}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Cases by Status</h2>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart placeholder - integrate Recharts
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Monthly Trends</h2>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart placeholder - integrate Recharts
                    </div>
                </div>
            </div>
        </div>
    );
}

