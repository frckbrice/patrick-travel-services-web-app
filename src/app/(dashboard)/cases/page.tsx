'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CasesPage() {
    const [filter, setFilter] = useState('all');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
                    <p className="mt-2 text-gray-600">
                        Manage and track all immigration cases
                    </p>
                </div>
                <Link
                    href="/dashboard/cases/new"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                >
                    + New Case
                </Link>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mb-6">
                {['all', 'submitted', 'under_review', 'processing', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        {status.replace('_', ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Cases List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No cases found</p>
                        <p className="text-sm mt-2">Get started by creating your first case</p>
                        <Link
                            href="/dashboard/cases/new"
                            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Create Case
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

