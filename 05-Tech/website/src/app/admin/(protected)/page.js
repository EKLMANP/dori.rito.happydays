'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const FUNNEL_LABELS = {
    'Not started': '未開始',
    'booked call': '已預約諮詢',
    '1st session': '首次上課',
    'In progress(1-6/8)': '進行中',
    'Done': '已完成',
};

const FUNNEL_COLORS = {
    'Not started': 'bg-gray-300',
    'booked call': 'bg-blue-400',
    '1st session': 'bg-yellow-400',
    'In progress(1-6/8)': 'bg-orange-400',
    'Done': 'bg-green-500',
};

const SEVERITY_STYLES = {
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
};

const SEVERITY_ICONS = { red: '🔴', yellow: '🟡', orange: '🟠' };

export default function OverviewPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/dashboard');
            if (!res.ok) throw new Error(`API ${res.status}`);
            setData(await res.json());
        } catch (err) {
            console.error('[Overview]', err);
            setError('無法載入資料，請重新整理');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const cards = data?.cards || {};
    const funnel = data?.funnel || [];
    const workload = data?.trainerWorkload || {};
    const alerts = data?.alerts || [];
    const funnelMax = Math.max(...funnel.map(f => f.count), 1);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
                    <p className="text-sm text-gray-400 mt-1">營運總覽</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/analytics" className="text-sm text-brand-orange hover:text-orange-700 font-medium">
                        📈 詳細分析 →
                    </Link>
                    <button onClick={fetchData} disabled={loading} className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">
                        ↻ 重新整理
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* === Section 1: Core Stats Cards === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="本月營收"
                    value={loading ? '—' : `NT$${(cards.monthRevenue ?? 0).toLocaleString()}`}
                    subtitle="已付款訂單"
                    icon="💰"
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="付款處理中"
                    value={loading ? '—' : `NT$${(cards.pendingPayment ?? 0).toLocaleString()}`}
                    subtitle="ATM/超商待到帳"
                    icon="⏳"
                    color="yellow"
                    loading={loading}
                />
                <StatCard
                    title="進行中課程"
                    value={loading ? '—' : cards.activeOrderCount ?? 0}
                    subtitle="組客人在上課"
                    icon="📚"
                    color="orange"
                    loading={loading}
                />
                <StatCard
                    title="本月新客戶"
                    value={loading ? '—' : cards.monthNewCustomers ?? 0}
                    subtitle="人"
                    icon="👥"
                    color="blue"
                    loading={loading}
                />
            </div>

            {/* === Section 2: Conversion Funnel === */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">客戶轉換漏斗</h2>
                {loading ? (
                    <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                    <div className="space-y-3">
                        {funnel.map(({ stage, count }) => (
                            <div key={stage} className="flex items-center gap-3">
                                <span className="w-28 text-xs text-gray-500 text-right shrink-0">
                                    {FUNNEL_LABELS[stage] || stage}
                                </span>
                                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${FUNNEL_COLORS[stage] || 'bg-gray-400'}`}
                                        style={{ width: `${Math.max((count / funnelMax) * 100, 2)}%` }}
                                    />
                                </div>
                                <span className="w-8 text-sm font-semibold text-gray-700 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* === Section 3: Trainer Workload === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {loading ? (
                    <>
                        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    </>
                ) : Object.keys(workload).length === 0 ? (
                    <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
                        目前沒有進行中的課程
                    </div>
                ) : (
                    Object.entries(workload).map(([name, stats]) => (
                        <div key={name} className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-800 mb-3">{name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-2xl font-bold text-orange-500">{stats.activeOrders}</p>
                                    <p className="text-xs text-gray-400">進行中訂單</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-500">{stats.remainingSessions}</p>
                                    <p className="text-xs text-gray-400">剩餘總堂數</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* === Section 4: Alerts === */}
            {!loading && alerts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">需要注意</h2>
                    <div className="space-y-2">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${SEVERITY_STYLES[alert.severity]}`}>
                                <span>{SEVERITY_ICONS[alert.severity]}</span>
                                <span className="flex-1">{alert.message}</span>
                                {alert.orderId && (
                                    <Link href={`/admin/orders/${alert.orderId}`} className="text-xs font-medium underline">
                                        查看訂單
                                    </Link>
                                )}
                                {alert.customerId && (
                                    <Link href={`/admin/customers/${alert.customerId}`} className="text-xs font-medium underline">
                                        查看客戶
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === Section 5: Quick Actions === */}
            <div className="flex gap-3">
                <Link href="/admin/customers" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    + 新增客戶
                </Link>
                <Link href="/admin/orders/new" className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    + 新增訂單
                </Link>
            </div>
        </div>
    );
}

/* Inline StatCard component */
function StatCard({ title, value, subtitle, icon, color, loading }) {
    const colorMap = {
        green: 'bg-green-50 border-green-100',
        yellow: 'bg-yellow-50 border-yellow-100',
        orange: 'bg-orange-50 border-orange-100',
        blue: 'bg-blue-50 border-blue-100',
    };

    return (
        <div className={`rounded-xl border p-5 ${colorMap[color] || 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{title}</span>
                <span className="text-lg">{icon}</span>
            </div>
            {loading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    );
}
