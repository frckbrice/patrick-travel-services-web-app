'use client';

// App providers wrapper

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { FirebaseAuthProvider } from '@/components/auth/FirebaseAuthProvider';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import '@/lib/i18n/config';

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
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <FirebaseAuthProvider>
                    {children}
                    <Toaster position="top-right" richColors />
                    <ReactQueryDevtools initialIsOpen={false} />
                    <InstallPrompt />
                </FirebaseAuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

