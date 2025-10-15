import { Suspense } from 'react';
import { FAQList } from '@/features/faq/components/FAQList';
import DashboardLoading from '../loading';

export default function FAQPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <FAQList />
        </Suspense>
    );
}
