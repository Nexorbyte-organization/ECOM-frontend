'use client';

import './globals.css';
import { UpdateErrorScreen } from '@/components/shared/UpdateNotice';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    return (
        <html>
            <body className="font-sans">
                <UpdateErrorScreen error={error} />
            </body>
        </html>
    );
}
