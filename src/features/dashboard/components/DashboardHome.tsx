'use client';

import { useAuthStore } from '@/stores/auth/authStore';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ReactNode } from 'react';

export function DashboardHome() {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    const stats = [
        { label: t('dashboard.activeCases'), value: '12', change: '+2 this week', color: 'blue' },
        { label: t('dashboard.pendingDocuments'), value: '5', change: '3 need review', color: 'yellow' },
        { label: t('dashboard.newMessages'), value: '8', change: '2 unread', color: 'green' },
        { label: t('dashboard.notifications'), value: '15', change: '5 new today', color: 'purple' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.welcomeBack')}, {user?.firstName}!
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Here's what's happening with your immigration cases today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        <p className={`mt-2 text-sm text-${stat.color}-600`}>{stat.change}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">{t('dashboard.quickActions')}</h2>
                    <div className="space-y-2">
                        <QuickActionButton href="/dashboard/cases/new">
                            📋 Submit New Case
                        </QuickActionButton>
                        <QuickActionButton href="/dashboard/documents">
                            📄 Upload Document
                        </QuickActionButton>
                        <QuickActionButton href="/dashboard/messages">
                            💬 Send Message
                        </QuickActionButton>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">{t('dashboard.recentActivity')}</h2>
                    <div className="space-y-3">
                        <ActivityItem
                            icon="✅"
                            title="Case Updated"
                            description="Student Visa application status changed"
                            time="2 hours ago"
                        />
                        <ActivityItem
                            icon="📄"
                            title="Document Uploaded"
                            description="Passport copy received"
                            time="5 hours ago"
                        />
                        <ActivityItem
                            icon="💬"
                            title="New Message"
                            description="Agent replied to your query"
                            time="1 day ago"
                        />
                    </div>
                </div>
            </div>

            {/* Cases Overview for Admin/Agent */}
            {user?.role !== 'CLIENT' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Cases Overview</h2>
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <p>Cases list will be displayed here</p>
                        <Link href="/dashboard/cases" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 mt-2 inline-block">
                            {t('dashboard.viewAll')} →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuickActionButton({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="block px-4 py-3 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors dark:text-gray-300"
        >
            {children}
        </Link>
    );
}

function ActivityItem({
    icon,
    title,
    description,
    time,
}: {
    icon: string;
    title: string;
    description: string;
    time: string;
}) {
    return (
        <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
            </div>
        </div>
    );
}

