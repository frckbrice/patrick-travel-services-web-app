'use client';

import { useTranslation } from 'react-i18next';

export function SettingsView() {
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('settings.title')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage your account preferences
                </p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">{t('settings.general')}</h2>
                    <div className="space-y-4">
                        <SettingItem
                            label={t('settings.emailNotifications')}
                            description="Receive email updates about your cases"
                        />
                        <SettingItem
                            label={t('settings.pushNotifications')}
                            description="Get push notifications on mobile"
                        />
                        <SettingItem
                            label={t('settings.smsNotifications')}
                            description="Receive SMS for important updates"
                        />
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">{t('settings.security')}</h2>
                    <div className="space-y-3">
                        <button className="block w-full text-left px-4 py-3 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors dark:text-gray-300">
                            {t('settings.changePassword')}
                        </button>
                        <button className="block w-full text-left px-4 py-3 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors dark:text-gray-300">
                            {t('settings.twoFactorAuth')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingItem({ label, description }: { label: string; description: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-b-0">
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}

