import { Suspense } from 'react';
import { InviteCodeManager } from '@/features/admin/components/InviteCodeManager';

export default function InviteCodesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <InviteCodeManager />
        </Suspense>
    );
}

