'use client';

import { useTranslation } from 'react-i18next';

export function NotificationsList() {
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.notifications')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Stay updated with all your case activities
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-5xl mb-4">🔔</p>
                        <p className="text-lg">No notifications</p>
                        <p className="text-sm mt-2">You're all caught up!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

