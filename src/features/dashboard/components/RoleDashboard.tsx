'use client';

import { useAuthStore } from '@/features/auth/store';
import { useRouter } from 'next/navigation';
import { useEffect, lazy, Suspense } from 'react';

// PERFORMANCE: Lazy load dashboard components to reduce initial bundle size
const DashboardHome = lazy(() =>
  import('./DashboardHome').then((m) => ({ default: m.DashboardHome }))
);
const AgentDashboard = lazy(() =>
  import('./AgentDashboard').then((m) => ({ default: m.AgentDashboard }))
);

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

export function RoleDashboard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  // Handle authentication guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <DashboardLoading />;
  }

  // Prevent rendering if not authenticated (will redirect in useEffect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // PERFORMANCE: Use Suspense with lazy-loaded components
  // Role-based dashboard rendering (only for authenticated users)
  if (user.role === 'AGENT' || user.role === 'ADMIN') {
    return (
      <Suspense fallback={<DashboardLoading />}>
        {/*  Agent/Admin dashboard */}
        <AgentDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      {/*  Client dashboard */}
      <DashboardHome />
    </Suspense>
  );
}
