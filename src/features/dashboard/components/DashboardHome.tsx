'use client';

import { useAuthStore } from '@/features/auth/store';
import { useCases } from '@/features/cases/api';
import { useDocuments } from '@/features/documents/api';
import { useConversations } from '@/features/messages/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, FileText, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function DashboardHome() {
    const { user } = useAuthStore();
    const { data: casesData, isLoading: casesLoading } = useCases({});
    const { data: documentsData } = useDocuments({});
    const { data: conversationsData } = useConversations();

    // Calculate pending documents (documents with PENDING status)
    const pendingDocuments = documentsData?.documents?.filter(doc => doc.status === 'PENDING').length || 0;

    // Calculate unread messages from conversations
    const unreadMessages = conversationsData?.reduce((total, room) => {
        if (room.unreadCount && user?.id) {
            return total + (room.unreadCount[user.id] || 0);
        }
        return total;
    }, 0) || 0;
    
    const stats = {
        totalCases: casesData?.cases?.length || 0,
        activeCases: casesData?.cases?.filter((c: any) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status)).length || 0,
        completedCases: casesData?.cases?.filter((c: any) => c.status === 'APPROVED').length || 0,
        pendingDocuments,
        unreadMessages,
    };

    if (casesLoading) return <DashboardHomeSkeleton />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">
                    Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
                </h1>
                <p className="text-muted-foreground mt-2">Here is an overview of your immigration cases</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCases}</div>
                        <p className="text-xs text-muted-foreground">{stats.activeCases} active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
                        <p className="text-xs text-muted-foreground">Documents to upload</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unreadMessages}</div>
                        <p className="text-xs text-muted-foreground">From your advisor</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedCases}</div>
                        <p className="text-xs text-muted-foreground">Successful cases</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/cases"><Briefcase className="mr-2 h-4 w-4" />View My Cases</Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/documents"><FileText className="mr-2 h-4 w-4" />Upload Documents</Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/messages"><MessageSquare className="mr-2 h-4 w-4" />Message Advisor</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" />Need Help?</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Have questions? We are here to help!</p>
                        <Button asChild><Link href="/dashboard/messages">Contact Advisor</Link></Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function DashboardHomeSkeleton() {
    return (
        <div className="space-y-8">
            <div><Skeleton className="h-9 w-64" /><Skeleton className="h-5 w-96 mt-2" /></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1,2,3,4].map(i => <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /><Skeleton className="h-3 w-20 mt-2" /></CardContent></Card>)}
            </div>
        </div>
    );
}
