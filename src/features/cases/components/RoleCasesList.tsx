'use client';

import { useAuthStore } from '@/features/auth/store';
import { CasesList } from './CasesList';
import { AgentCasesList } from './AgentCasesList';

export function RoleCasesList() {
    const { user } = useAuthStore();
    
    if (user?.role === 'AGENT' || user?.role === 'ADMIN') {
        return <AgentCasesList />;
    }
    
    return <CasesList />;
}
