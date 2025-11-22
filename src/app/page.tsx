import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LandingView } from '@/components/landing/LandingView';

// PERFORMANCE: Add metadata for SEO
export const metadata = {
  title: 'Patrick Travel Services - Immigration Management Platform',
  description:
    'Complete immigration services management platform for streamlined case management, document processing, and client communications',
};

// PERFORMANCE: Use auto for better client-side interactivity
export const dynamic = 'auto';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-white dark:bg-gray-950">
      {/* Clean white background for light mode, keep dark mode as is */}
      <div className="fixed inset-0 -z-10 bg-white dark:bg-gray-950" />

      <Navbar />
      <main className="flex-1 w-full relative z-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]" aria-label="Loading">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
                role="status"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          }
        >
          <LandingView />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
