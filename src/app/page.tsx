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

// PERFORMANCE: Enable static generation for landing page
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* PERFORMANCE: Optimized gradient background with will-change and transform */}
      <div className="fixed inset-0 -z-10" style={{ willChange: 'transform' }}>
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />

        {/* PERFORMANCE: Reduced blur and opacity for better rendering */}
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-primary/20 via-blue-500/10 to-transparent dark:from-primary/30 dark:via-blue-600/20 dark:to-transparent rounded-full opacity-30 dark:opacity-50"
          style={{ filter: 'blur(60px)', willChange: 'opacity' }}
        />

        <div
          className="absolute top-1/3 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-transparent dark:from-purple-600/20 dark:via-pink-600/15 dark:to-transparent rounded-full opacity-25 dark:opacity-40"
          style={{ filter: 'blur(60px)', willChange: 'opacity' }}
        />

        {/* Mesh gradient overlay - simplified */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10" />
      </div>

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
