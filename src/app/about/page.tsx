import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AboutView } from '@/components/about/AboutView';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-white dark:bg-gray-950">
      {/* Clean white background for light mode */}
      <div className="fixed inset-0 -z-10 bg-white dark:bg-gray-950" />

      <Navbar />

      <main className="flex-1 w-full relative z-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }
        >
          <AboutView />
        </Suspense>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
