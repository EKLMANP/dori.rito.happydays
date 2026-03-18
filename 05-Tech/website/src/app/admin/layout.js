'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Overview', href: '/admin', icon: '📊' },
    { label: '營運分析', href: '/admin/analytics', icon: '📈' },
    { label: '客戶管理', href: '/admin/customers', icon: '👤' },
    { label: '訂單管理', href: '/admin/orders', icon: '📋' },
    { label: '服務項目', href: '/admin/services', icon: '📦' },
    { label: '問卷管理', href: '/admin/surveys', icon: '📝' },
    { label: 'Email 模板', href: '/admin/email-templates', icon: '✉️' },
];

function SidebarContent({ pathname, onLogout, onNavClick }) {
    return (
        <>
            {/* Brand */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-800">
                <Link href="/admin" className="text-base font-bold text-white tracking-tight">
                    Dori & Rito
                </Link>
                {onNavClick && (
                    <button onClick={onNavClick} className="md:hidden text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavClick}
                            className={`flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="border-t border-gray-800 px-3 py-3 space-y-1">
                <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-md hover:bg-gray-800/60 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    前往官網
                </Link>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 rounded-md hover:bg-gray-800/60 transition-colors text-left"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    登出
                </button>
            </div>
        </>
    );
}

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on navigation
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Login page bypasses layout
    if (pathname === '/admin/login') {
        return children;
    }

    async function handleLogout() {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.push('/admin/login');
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — mobile (slide-in overlay) */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <SidebarContent
                    pathname={pathname}
                    onLogout={handleLogout}
                    onNavClick={() => setSidebarOpen(false)}
                />
            </aside>

            {/* Sidebar — desktop (always visible) */}
            <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 bg-gray-900">
                <SidebarContent pathname={pathname} onLogout={handleLogout} />
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col md:ml-60">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-900">Dori & Rito Admin</span>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
