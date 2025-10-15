import { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
            {/* Gradient Background Orbs for Dark Mode */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 via-blue-500/15 to-transparent dark:from-primary/30 dark:via-blue-600/20 dark:to-transparent rounded-full blur-3xl opacity-30 dark:opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 via-blue-500/10 to-transparent dark:from-purple-600/20 dark:via-blue-600/15 dark:to-transparent rounded-full blur-3xl opacity-30 dark:opacity-40"></div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-0">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-2xl bg-white dark:bg-white shadow-lg">
                            <Image
                                src="/images/app-logo.png"
                                alt="Patrick Travel Services"
                                width={120}
                                height={120}
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        Patrick Travel Services
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Immigration Services Management Platform
                    </p>
                </div>

                {/* Content */}
                <main>{children}</main>

                {/* Footer */}
                <footer className="text-center mt-12 text-sm text-gray-600 dark:text-gray-400">
                    <p>&copy; 2025 Patrick Travel Services. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}

