'use client';

export default function NotificationsPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-2 text-gray-600">
                    Stay updated with all your case activities
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-5xl mb-4">🔔</p>
                        <p className="text-lg">No notifications</p>
                        <p className="text-sm mt-2">You're all caught up!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

