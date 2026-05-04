'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
    { label: 'Overview', href: '/admin', icon: '📊' },
    { label: '營運分析', href: '/admin/analytics', icon: '📈' },
    { label: '客戶管理', href: '/admin/customers', icon: '👥' },
    { label: '訂單管理', href: '/admin/orders', icon: '📦' },
    { label: '服務項目', href: '/admin/services', icon: '🐕' },
    {
        label: '備課工具',
        icon: '🎒',
        children: [
            { label: '狗狗作息表', href: '/admin/dog-schedule', icon: '🐶' },
            { label: '空間規劃器', href: '/admin/tools/puppy-space-planner', icon: '🏠' },
        ],
    },
    { label: '成本紀錄', href: '/admin/lesson-cost', icon: '✏️' },
    { label: '問卷管理', href: '/admin/forms', icon: '📋' },
    { label: 'Email 模板', href: '/admin/emails', icon: '📧' },
    { label: '操作紀錄', href: '/admin/logs', icon: '📝' },
];

function NavGroup({ item, pathname, onNavigate }) {
    const hasActiveChild = item.children.some((c) => pathname.startsWith(c.href));
    const [open, setOpen] = useState(hasActiveChild);

    useEffect(() => {
        if (hasActiveChild) setOpen(true);
    }, [hasActiveChild]);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    hasActiveChild
                        ? 'text-brand-orange hover:bg-orange-50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-expanded={open}
            >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                <span
                    className={`text-xs text-gray-400 transition-transform ${
                        open ? 'rotate-0' : '-rotate-90'
                    }`}
                >
                    ▾
                </span>
            </button>
            {open && (
                <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                        const isActive = pathname.startsWith(child.href);
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-orange-50 text-brand-orange'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <span className="text-lg">{child.icon}</span>
                                {child.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function AdminSidebar({ userEmail }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => signOut({ callbackUrl: '/admin/login' });

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                    <img
                        src="https://iili.io/qf6QsVe.png"
                        alt="Dori & Rito"
                        className="h-8"
                    />
                    <span className="font-bold text-gray-800 text-sm">Admin</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    if (item.children) {
                        return (
                            <NavGroup
                                key={item.label}
                                item={item}
                                pathname={pathname}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        );
                    }

                    const isActive =
                        item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-orange-50 text-brand-orange'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
                {userEmail && (
                    <p className="px-4 pb-2 text-xs text-gray-400 truncate" title={userEmail}>
                        {userEmail}
                    </p>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                    登出
                </button>
            </div>

            {/* Back to site */}
            <div className="p-4 border-t border-gray-100">
                <Link
                    href="/"
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ← 回到官網
                </Link>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                aria-label="開啟選單"
            >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/30"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Close button */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
                    aria-label="關閉選單"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {sidebarContent}
            </aside>

            {/* Desktop sidebar (always visible) */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col shrink-0">
                {sidebarContent}
            </aside>
        </>
    );
}
