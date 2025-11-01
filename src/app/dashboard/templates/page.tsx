'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminTemplateManager,
  AdminTemplateManagerSkeleton,
} from '@/features/admin/components/AdminTemplateManager';
import { useAuthStore } from '@/features/auth/store';

export default function TemplatesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    // Only allow ADMIN role to access templates
    if (!isLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user?.role, isLoading, router]);

  // Show skeleton while checking or redirecting
  if (isLoading || user?.role !== 'ADMIN') {
    return <AdminTemplateManagerSkeleton />;
  }

  return <AdminTemplateManager />;
}
