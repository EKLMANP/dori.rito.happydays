'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Overview', href: '/admin', icon: '📊' },
    { label: '營運分析', href: '/admin/analytics', icon: '📈' },
    { label: '客戶管理', href: '/admin/customers', icon: '👥' },
    { label: '訂單管理', href: '/admin/orders', icon: '📦' },
    { label: '服務項目', href: '/admin/services', icon: '🐕' },
    { label: '成本紀錄', href: '/admin/lesson-cost', icon: '✏️' },
    { label: '問卷管理', href: '/admin/forms', icon: '📋' },
    { label: 'Email 模板', href: '/admin/emails', icon: '📧' },
    { label: '操作紀錄', href: '/admin/logs', icon: '📝' },
];

export default function AdminSidebar({ onLogout }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Link href="/admin" className="flex items-center gap-3">
                    <img
                        src="https://iili.io/qf6QsVe.png"
                        alt="Dori & Rito"
                        className="h-8"
                    />
                    <span className="font-bold text-gray-800 text-sm">Admin</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
                <button
                    onClick={onLogout}
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
        </aside>
    );
}
