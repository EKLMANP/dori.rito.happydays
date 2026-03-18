'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/dashboard')
            .then((r) => r.json())
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="本月新訂單" value={stats?.monthOrderCount ?? '-'} color="blue" />
                <StatCard
                    label="本月營收"
                    value={stats?.monthRevenue != null ? `$${stats.monthRevenue.toLocaleString()}` : '-'}
                    color="green"
                />
                <StatCard label="進行中訂單" value={stats?.activeOrderCount ?? '-'} color="yellow" />
                <StatCard label="待收款訂單" value={stats?.unpaidOrderCount ?? '-'} color="red" />
            </div>

            {/* Quick actions */}
            <div className="flex gap-3 mb-8">
                <Link
                    href="/admin/orders/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                    + 新增訂單
                </Link>
                <Link
                    href="/admin/customers"
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                >
                    + 新增客戶
                </Link>
            </div>

            {/* Active orders table */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">進行中的訂單</h2>
                </div>
                {stats?.activeOrders?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600">訂單編號</th>
                                    <th className="px-4 py-2 text-left text-gray-600">訓犬師</th>
                                    <th className="px-4 py-2 text-left text-gray-600">剩餘堂數</th>
                                    <th className="px-4 py-2 text-left text-gray-600">付款</th>
                                    <th className="px-4 py-2 text-left text-gray-600">總金額</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.activeOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{order.trainer}</td>
                                        <td className="px-4 py-3 text-gray-700">{order.remainingSessions}/{order.sessions}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={order.paymentStatus} />
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">${order.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="px-4 py-8 text-center text-gray-500">目前沒有進行中的訂單</p>
                )}
            </div>

            {/* Unpaid orders */}
            {stats?.unpaidOrders?.length > 0 && (
                <div className="mt-6 bg-white rounded-lg border border-red-200">
                    <div className="px-4 py-3 border-b border-red-100 bg-red-50">
                        <h2 className="text-lg font-semibold text-red-800">待收款提醒</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600">訂單編號</th>
                                    <th className="px-4 py-2 text-left text-gray-600">狀態</th>
                                    <th className="px-4 py-2 text-left text-gray-600">付款</th>
                                    <th className="px-4 py-2 text-left text-gray-600">總金額</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.unpaidOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={order.orderStatus} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={order.paymentStatus} />
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">${order.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        red: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <div className={`rounded-lg border p-4 ${colors[color]}`}>
            <p className="text-sm opacity-75">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        '報價中': 'bg-gray-100 text-gray-700',
        '已確認': 'bg-blue-100 text-blue-700',
        '進行中': 'bg-yellow-100 text-yellow-700',
        '已完成': 'bg-green-100 text-green-700',
        '已取消': 'bg-red-100 text-red-700',
        '待付款': 'bg-red-100 text-red-700',
        '付款中': 'bg-yellow-100 text-yellow-700',
        '已付款': 'bg-green-100 text-green-700',
        '付款失敗': 'bg-red-100 text-red-700',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

function DashboardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg" />
                ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
    );
}
