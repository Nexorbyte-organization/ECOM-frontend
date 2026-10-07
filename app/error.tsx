'use client';

import { UpdateErrorScreen } from '@/components/shared/UpdateNotice';

export default function Error({ error }: { error: Error & { digest?: string } }) {
    return <UpdateErrorScreen error={error} />;
}
