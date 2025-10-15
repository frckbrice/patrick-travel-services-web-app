'use client';

import { useAuthStore } from '@/features/auth/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function ClientsList() {
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Clients
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage client accounts and information
                    </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">
                    + Add Client
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">No clients found</p>
                        <p className="text-sm mt-2">Clients will appear here when they register</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

