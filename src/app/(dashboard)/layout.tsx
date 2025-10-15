'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { useLogout } from '@/features/auth/api/useAuth';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const logoutMutation = useLogout();
    const { t } = useTranslation();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center space-x-3">
                                <Image
                                    src="/images/app-logo.png"
                                    alt="Patrick Travel Services"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                                <h1 className="text-xl font-bold text-blue-600">
                                    Patrick Travel Services
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <LanguageSwitcher />
                            <ThemeSwitcher />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                {user?.role}
                            </span>
                            <button
                                onClick={() => logoutMutation.mutate()}
                                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            >
                                {t('auth.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
                    <nav className="p-4 space-y-2">
                        <NavLink href="/dashboard" icon="📊">Dashboard</NavLink>
                        <NavLink href="/dashboard/cases" icon="📋">Cases</NavLink>
                        <NavLink href="/dashboard/documents" icon="📄">Documents</NavLink>
                        <NavLink href="/dashboard/messages" icon="💬">Messages</NavLink>
                        <NavLink href="/dashboard/notifications" icon="🔔">Notifications</NavLink>

                        {(user?.role === 'ADMIN' || user?.role === 'AGENT') && (
                            <>
                                <div className="pt-4 pb-2 border-t mt-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase">Management</p>
                                </div>
                                <NavLink href="/dashboard/clients" icon="👥">Clients</NavLink>
                                <NavLink href="/dashboard/analytics" icon="📈">Analytics</NavLink>
                                {user?.role === 'ADMIN' && (
                                    <>
                                        <NavLink href="/dashboard/users" icon="👤">Users</NavLink>
                                        <NavLink href="/dashboard/audit-logs" icon="📝">Audit Logs</NavLink>
                                    </>
                                )}
                            </>
                        )}

                        <div className="pt-4 pb-2 border-t mt-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase">Account</p>
                        </div>
                        <NavLink href="/dashboard/profile" icon="⚙️">Profile</NavLink>
                        <NavLink href="/dashboard/settings" icon="🔧">Settings</NavLink>
                        <NavLink href="/dashboard/faq" icon="❓">FAQ</NavLink>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="flex items-center space-x-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
            <span>{icon}</span>
            <span>{children}</span>
        </Link>
    );
}

