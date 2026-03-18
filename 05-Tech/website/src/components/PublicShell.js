'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Conditionally renders Header/Footer only for public (non-admin) pages.
 */
export default function PublicShell({ children }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return children;
    }

    return (
        <>
            <Header />
            <main>{children}</main>
            <Footer />
        </>
    );
}
