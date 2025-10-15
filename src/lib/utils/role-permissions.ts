// Role-based permissions and navigation

import {
    LayoutDashboard,
    Briefcase,
    FileText,
    MessageSquare,
    Bell,
    User,
    Users,
    Settings,
    BarChart3,
    Shield,
    HelpCircle,
    FileCheck,
    LucideIcon
} from 'lucide-react';

export type UserRole = 'CLIENT' | 'AGENT' | 'ADMIN';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    roles: UserRole[];
    description?: string;
}

// Navigation items with role-based access
export const navigationItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['CLIENT', 'AGENT', 'ADMIN'],
        description: 'Overview and quick actions',
    },
    {
        title: 'My Cases',
        href: '/dashboard/cases',
        icon: Briefcase,
        roles: ['CLIENT'],
        description: 'View your immigration cases',
    },
    {
        title: 'Cases',
        href: '/dashboard/cases',
        icon: Briefcase,
        roles: ['AGENT', 'ADMIN'],
        description: 'Manage immigration cases',
    },
    {
        title: 'Documents',
        href: '/dashboard/documents',
        icon: FileText,
        roles: ['CLIENT', 'AGENT', 'ADMIN'],
        description: 'Manage documents',
    },
    {
        title: 'Messages',
        href: '/dashboard/messages',
        icon: MessageSquare,
        roles: ['CLIENT', 'AGENT', 'ADMIN'],
        description: 'Communication center',
    },
    {
        title: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
        roles: ['CLIENT', 'AGENT', 'ADMIN'],
        description: 'View notifications',
    },
    {
        title: 'Clients',
        href: '/dashboard/clients',
        icon: Users,
        roles: ['AGENT', 'ADMIN'],
        description: 'Manage clients',
    },
    {
        title: 'Users',
        href: '/dashboard/users',
        icon: Users,
        roles: ['ADMIN'],
        description: 'User management',
    },
    {
        title: 'Invite Codes',
        href: '/dashboard/invite-codes',
        icon: FileCheck,
        roles: ['ADMIN'],
        description: 'Generate staff invite codes',
    },
    {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        roles: ['AGENT', 'ADMIN'],
        description: 'Performance metrics',
    },
    {
        title: 'Audit Logs',
        href: '/dashboard/audit-logs',
        icon: Shield,
        roles: ['ADMIN'],
        description: 'System audit trail',
    },
    {
        title: 'FAQ',
        href: '/dashboard/faq',
        icon: HelpCircle,
        roles: ['AGENT', 'ADMIN'],
        description: 'Manage FAQ content',
    },
    {
        title: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        roles: ['CLIENT', 'AGENT', 'ADMIN'],
        description: 'Your profile',
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['CLIENT', 'AGENT', 'ADMIN'],
        description: 'Preferences',
    },
];

// Filter navigation items by role
export function getNavigationForRole(role: UserRole): NavItem[] {
    return navigationItems.filter((item) => item.roles.includes(role));
}

// Check if user has access to a route
export function hasAccessToRoute(role: UserRole, route: string): boolean {
    const navItem = navigationItems.find((item) => route.startsWith(item.href));
    return navItem ? navItem.roles.includes(role) : false;
}

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
    CLIENT: 'Client',
    AGENT: 'Agent',
    ADMIN: 'Administrator',
};

// Role badges colors
export const roleBadgeColors: Record<UserRole, string> = {
    CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

