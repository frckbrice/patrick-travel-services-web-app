'use client';

import { useAuthStore } from '@/stores/auth/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditLogsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Only ADMIN can access this page
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="mt-2 text-gray-600">
                    Track all system activities and changes
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No audit logs available</p>
                        <p className="text-sm mt-2">System activities will be logged here</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

