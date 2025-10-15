import { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/images/app-logo.png"
                            alt="Patrick Travel Services"
                            width={120}
                            height={120}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-blue-600">
                        Patrick Travel Services
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Immigration Services Management Platform
                    </p>
                </div>

                {/* Content */}
                <main>{children}</main>

                {/* Footer */}
                <footer className="text-center mt-12 text-sm text-gray-600">
                    <p>&copy; 2025 Patrick Travel Services. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}

