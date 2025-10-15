'use client';

import { useAuthStore } from '@/stores/auth/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

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
                    <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                    <p className="mt-2 text-gray-600">
                        Manage client accounts and information
                    </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">
                    + Add Client
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No clients found</p>
                        <p className="text-sm mt-2">Clients will appear here when they register</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

