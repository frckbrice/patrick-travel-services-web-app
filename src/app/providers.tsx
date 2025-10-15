'use client';

// App providers wrapper

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { FirebaseAuthProvider } from '@/components/auth/FirebaseAuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <FirebaseAuthProvider>
                {children}
                <Toaster position="top-right" richColors />
                <ReactQueryDevtools initialIsOpen={false} />
            </FirebaseAuthProvider>
        </QueryClientProvider>
    );
}

