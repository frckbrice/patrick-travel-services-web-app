'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Plus, Shield, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InviteCode {
    id: string;
    code: string;
    role: 'AGENT' | 'ADMIN';
    createdBy: string;
    usedBy: string | null;
    maxUses: number;
    usedCount: number;
    expiresAt: string;
    isActive: boolean;
    createdAt: string;
    usedAt: string | null;
}

export function InviteCodeManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [role, setRole] = useState<'AGENT' | 'ADMIN'>('AGENT');
    const [expiresInDays, setExpiresInDays] = useState(7);
    const [maxUses, setMaxUses] = useState(1);

    // Fetch invite codes
    const { data: inviteCodes, refetch } = useQuery({
        queryKey: ['invite-codes'],
        queryFn: async () => {
            const response = await apiClient.get<{ data: { inviteCodes: InviteCode[] } }>('/api/admin/invite-codes');
            return response.data.data.inviteCodes;
        },
    });

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
            navigator.clipboard.writeText(data.code);
            toast.info('Code copied to clipboard!');
        },
        onError: () => {
            toast.error('Failed to generate invite code');
        },
    });

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Code copied to clipboard!');
    };

    const getRoleBadgeColor = (role: string) => {
        return role === 'ADMIN'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Invite Codes</h2>
                    <p className="text-muted-foreground">
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
                                <Label>Role</Label>
                                <Select value={role} onValueChange={(v) => setRole(v as 'AGENT' | 'ADMIN')}>
                                    <SelectTrigger>
                                        <SelectValue />
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
                                <Label>Expires In (days)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={expiresInDays}
                                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Uses</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(Number(e.target.value))}
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

            <div className="grid gap-4">
                {inviteCodes?.map((code) => (
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
                                    <Badge variant={code.isActive && new Date(code.expiresAt) > new Date() ? 'default' : 'secondary'}>
                                        {code.isActive && new Date(code.expiresAt) > new Date() ? 'Active' : 'Expired'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Used</p>
                                    <p className="font-medium">
                                        {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : 'Not yet'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

