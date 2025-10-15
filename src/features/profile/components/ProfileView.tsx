'use client';

import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from 'react-i18next';

export function ProfileView() {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('profile.title')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage your personal information
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold dark:text-white">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
                        <span className="inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                            {user?.role}
                        </span>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-6 dark:text-white">
                        {t('profile.personalInfo')}
                    </h2>
                    <div className="space-y-4">
                        <ProfileField label={t('auth.firstName')} value={user?.firstName || ''} />
                        <ProfileField label={t('auth.lastName')} value={user?.lastName || ''} />
                        <ProfileField label={t('auth.email')} value={user?.email || ''} />
                        <ProfileField label={t('auth.phone')} value={user?.phone || 'Not provided'} />
                        <ProfileField label={t('profile.accountStatus')} value={user?.isActive ? 'Active' : 'Inactive'} />
                        <ProfileField label={t('profile.emailVerified')} value={user?.isVerified ? 'Yes' : 'No'} />
                    </div>

                    <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {t('profile.editProfile')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
            <span className="text-sm text-gray-900 dark:text-gray-200">{value}</span>
        </div>
    );
}

