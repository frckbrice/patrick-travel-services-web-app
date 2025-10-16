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
        return <AgentDashboard />; //TODO: ADMIN sees same as AGENT for now, will enhance later
    }

    return <DashboardHome />; // CLIENT
}
