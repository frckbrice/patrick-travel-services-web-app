'use client';

export default function MessagesPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                <p className="mt-2 text-gray-600">
                    Communicate with agents and support team
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                {/* Conversations List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
                    <div className="p-4 border-b">
                        <h2 className="font-bold">Conversations</h2>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                        No conversations yet
                    </div>
                </div>

                {/* Chat Area */}
                <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="font-bold">Select a conversation</h2>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <p className="text-5xl mb-4">💬</p>
                            <p>Start a conversation with your agent</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

