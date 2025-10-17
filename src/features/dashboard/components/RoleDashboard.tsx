'use client';

import { useAuthStore } from '@/features/auth/store';
import { DashboardHome } from './DashboardHome';
import { AgentDashboard } from './AgentDashboard';

export function RoleDashboard() {
    const { user } = useAuthStore();

    if (user?.role === 'AGENT') {
        return <AgentDashboard />;
    }

    if (user?.role === 'ADMIN') {
        // ADMIN has full system access and sees all cases (not filtered by assignment)
        return <AgentDashboard />;
    }

    return <DashboardHome />; // CLIENT
}
