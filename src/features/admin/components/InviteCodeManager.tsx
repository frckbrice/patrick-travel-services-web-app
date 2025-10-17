'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/utils/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Copy, Plus, Shield, Users, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InviteCode {
    id: string;
    code: string;
    role: 'AGENT' | 'ADMIN';
    createdBy: string;
    lastUsedBy: string | null;
    maxUses: number;
    usedCount: number;
    expiresAt: string;
    isActive: boolean;
    createdAt: string;
    lastUsedAt: string | null;
}

interface PaginationMetadata {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function InviteCodeManager() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [role, setRole] = useState<'AGENT' | 'ADMIN'>('AGENT');
    const [expiresInDays, setExpiresInDays] = useState(7);
    const [maxUses, setMaxUses] = useState(1);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Session awareness: Only ADMIN can access
    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Fetch invite codes
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['invite-codes', page, limit],
        queryFn: async () => {
            const response = await apiClient.get<{
                data: {
                    inviteCodes: InviteCode[];
                    pagination: PaginationMetadata;
                }
            }>(`/api/admin/invite-codes?page=${page}&limit=${limit}`);
            return response.data.data;
        },
        staleTime: 60 * 1000, // 1 minute
    });

    // Guard: Return null if not ADMIN
    if (user && user.role !== 'ADMIN') {
        return null;
    }

    const inviteCodes = data?.inviteCodes || [];
    const pagination = data?.pagination;

    // Copy to clipboard helper
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code)
            .then(() => toast.success('Code copied to clipboard!'))
            .catch(() => toast.error('Failed to copy to clipboard'));
    };

    // Generate invite code mutation
    const generateMutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<{ data: { inviteCode: InviteCode } }>('/api/admin/invite-codes', {
                role,
                expiresInDays,
                maxUses,
            });
            return response.data.data.inviteCode;
        },
        onSuccess: (data) => {
            toast.success(`${data.role} invite code generated!`);
            setIsDialogOpen(false);
            refetch();
            // Auto-copy to clipboard
            copyToClipboard(data.code);
        },
        onError: (error: any) => {
            toast.error(`Failed to generate invite code: ${error.response?.data?.error || error.message}`);
        },
    });

    const getRoleBadgeColor = (role: string) => {
        return role === 'ADMIN'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    };

    if (isLoading) return <InviteCodeManagerSkeleton />;

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invite Codes</h1>
                    <p className="text-muted-foreground mt-2">Generate invite codes for new staff members</p>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-destructive">Failed to load invite codes. Please try again.</p>
                        <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        <Key className="inline-block mr-2 h-8 w-8 text-primary" />
                        Invite Codes
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Generate invite codes for new staff members
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Invite Code</DialogTitle>
                            <DialogDescription>
                                Create a new invite code for staff registration
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(v) => setRole(v as 'AGENT' | 'ADMIN')}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AGENT">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Agent
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="ADMIN">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Administrator
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiresInDays">Expires In (days)</Label>
                                <Input
                                    id="expiresInDays"
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={expiresInDays}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= 365) {
                                            setExpiresInDays(val);
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxUses">Max Uses</Label>
                                <Input
                                    id="maxUses"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxUses}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= 100) {
                                            setMaxUses(val);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                            className="w-full"
                        >
                            {generateMutation.isPending ? 'Generating...' : 'Generate Code'}
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Empty State */}
            {inviteCodes.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Invite Codes</h3>
                        <p className="text-muted-foreground mb-4">
                            Generate your first invite code to onboard new staff members
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Generate First Code
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Invite Codes List */}
            {inviteCodes.length > 0 && (
                <div className="grid gap-4">
                    {inviteCodes.map((code) => (
                    <Card key={code.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge className={getRoleBadgeColor(code.role)}>
                                        {code.role}
                                    </Badge>
                                    <div>
                                        <CardTitle className="text-sm font-mono">{code.code}</CardTitle>
                                        <CardDescription>
                                            Created {new Date(code.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(code.code)}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Usage</p>
                                    <p className="font-medium">
                                        {code.usedCount}/{code.maxUses}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Expires</p>
                                    <p className="font-medium">
                                        {new Date(code.expiresAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    {(() => {
                                        const isActiveAndValid = code.isActive && new Date(code.expiresAt) > new Date();
                                        return (
                                            <Badge variant={isActiveAndValid ? 'default' : 'secondary'}>
                                                {isActiveAndValid ? 'Active' : 'Expired'}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                                <div>
                                        <p className="text-muted-foreground">Last Used</p>
                                    <p className="font-medium">
                                            {code.lastUsedAt ? new Date(code.lastUsedAt).toLocaleDateString() : 'Not yet'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} invite codes
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function InviteCodeManagerSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-96 mt-2" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-6 w-16" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="space-y-2">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

