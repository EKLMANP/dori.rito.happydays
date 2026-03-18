'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Login page now redirects to /admin — PIN auth is handled by the layout's AdminPinGate.
 */
export default function AdminLoginPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-gray-400">重新導向中...</p>
        </div>
    );
}
