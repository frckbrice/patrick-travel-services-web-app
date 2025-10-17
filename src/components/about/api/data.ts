import { Award, Target, Users, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ValueItem {
    icon: LucideIcon;
    titleKey: string;
    descriptionKey: string;
    gradient: string;
}

export interface TeamMember {
    nameKey: string;
    roleKey: string;
    descriptionKey: string;
    avatar: string;
}

export const values: ValueItem[] = [
    {
        icon: Award,
        titleKey: 'about.values.excellence.title',
        descriptionKey: 'about.values.excellence.description',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Heart,
        titleKey: 'about.values.compassion.title',
        descriptionKey: 'about.values.compassion.description',
        gradient: 'from-red-500 to-pink-500',
    },
    {
        icon: Target,
        titleKey: 'about.values.results.title',
        descriptionKey: 'about.values.results.description',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        icon: Users,
        titleKey: 'about.values.partnership.title',
        descriptionKey: 'about.values.partnership.description',
        gradient: 'from-purple-500 to-pink-500',
    },
];

export const team: TeamMember[] = [
    {
        nameKey: 'about.team.member1.name',
        roleKey: 'about.team.member1.role',
        descriptionKey: 'about.team.member1.description',
        avatar: 'PE',
    },
    {
        nameKey: 'about.team.member2.name',
        roleKey: 'about.team.member2.role',
        descriptionKey: 'about.team.member2.description',
        avatar: 'ST',
    },
    {
        nameKey: 'about.team.member3.name',
        roleKey: 'about.team.member3.role',
        descriptionKey: 'about.team.member3.description',
        avatar: 'DC',
    },
];

