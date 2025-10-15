'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function CasesList() {
    const [filter, setFilter] = useState('all');
    const { t } = useTranslation();

    const filters = ['all', 'submitted', 'under_review', 'processing', 'approved', 'rejected'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('cases.title')}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage and track all immigration cases
                    </p>
                </div>
                <Link
                    href="/dashboard/cases/new"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                >
                    + {t('cases.newCase')}
                </Link>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mb-6 overflow-x-auto">
                {filters.map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                            }`}
                    >
                        {t(`cases.${status}`).toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Cases List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">No cases found</p>
                        <p className="text-sm mt-2">Get started by creating your first case</p>
                        <Link
                            href="/dashboard/cases/new"
                            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {t('cases.newCase')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

