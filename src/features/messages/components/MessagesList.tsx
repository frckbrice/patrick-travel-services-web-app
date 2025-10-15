'use client';

import { useTranslation } from 'react-i18next';

export function MessagesList() {
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('messages.title')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Communicate with agents and support team
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                {/* Conversations List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="font-bold dark:text-white">{t('messages.conversations')}</h2>
                    </div>
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {t('messages.noMessages')}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="font-bold dark:text-white">Select a conversation</h2>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <p className="text-5xl mb-4">💬</p>
                            <p>{t('messages.startConversation')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

