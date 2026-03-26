'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from './AdminAuthGate';

const NAV_ITEMS = [
    { href: '/admin', label: '營運分析', icon: '📊' },
    { href: '/admin/lesson-cost', label: '記錄成本', icon: '✏️' },
];

export default function AdminNav() {
    const pathname = usePathname();
    const { logout } = useAdminAuth();

    return (
        <>
            {/* Top bar */}
            <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Dori & Rito</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">管理後台</span>
                </div>
                <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-gray-600 transition"
                >
                    登出
                </button>
            </header>

            {/* Bottom tab bar (mobile-friendly) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="flex">
                    {NAV_ITEMS.map(({ href, label, icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex-1 flex flex-col items-center py-2.5 text-xs transition ${
                                    isActive
                                        ? 'text-orange-600 font-semibold'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <span className="text-lg mb-0.5">{icon}</span>
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
