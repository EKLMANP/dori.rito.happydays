'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import SystemHealth from '@/components/admin/SystemHealth';
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart';
import ProfitDashboard from '@/components/admin/ProfitDashboard';

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/analytics/overview');
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            setData(await res.json());
        } catch (err) {
            console.error('[Dashboard] Failed to load:', err);
            setError('無法載入資料，請重新整理');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const cards = data?.cards || {};

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-1">營運總覽</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/analytics"
                        className="text-sm text-brand-orange hover:text-orange-700 font-medium transition-colors"
                    >
                        📈 詳細分析 →
                    </Link>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    >
                        ↻ 重新整理
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Stats Cards — 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="本週預約"
                    value={loading ? '—' : cards.weeklyBookings ?? 0}
                    subtitle="筆預約"
                    icon="📅"
                    color="orange"
                    loading={loading}
                />
                <StatCard
                    title="本月營收"
                    value={loading ? '—' : `NT$${(cards.monthlyRevenue ?? 0).toLocaleString()}`}
                    subtitle={new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
                    icon="💰"
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="即將到來"
                    value={loading ? '—' : cards.pendingCount ?? 0}
                    subtitle="筆待進行"
                    icon="⏰"
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="總客戶數"
                    value={loading ? '—' : cards.totalCustomers ?? 0}
                    subtitle="Notion CRM"
                    icon="👥"
                    color="purple"
                    loading={loading}
                />
            </div>

            {/* Middle Row: Revenue Trend + System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Revenue Trend Chart — takes 2/3 width */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">近 4 週營收趨勢</h3>
                    <SimpleBarChart
                        data={data?.revenueTrend || []}
                        xKey="week"
                        yKey="revenue"
                        color="#F75000"
                        height={220}
                        yLabel="元"
                        loading={loading}
                    />
                </div>

                {/* System Health — takes 1/3 width */}
                <SystemHealth health={data?.systemHealth} loading={loading} />
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">近期預約</h2>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : !data?.recentBookings?.length ? (
                    <p className="text-gray-500 text-sm py-8 text-center">
                        目前沒有預約紀錄
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">客戶</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">狗狗</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">日期</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">時間</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">服務</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">金額</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">訂單編號</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentBookings.map((booking) => {
                                    const isUpcoming = booking.slot_date >= new Date().toISOString().split('T')[0];
                                    return (
                                        <tr key={booking.merchant_trade_no} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2 font-medium text-gray-800">
                                                {booking.customer_name}
                                            </td>
                                            <td className="py-3 px-2 text-gray-600">
                                                {booking.dog_name || '—'}
                                            </td>
                                            <td className="py-3 px-2 text-gray-600">
                                                <span className="flex items-center gap-1.5">
                                                    {booking.slot_date}
                                                    {isUpcoming && (
                                                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full" title="即將到來" />
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-gray-600">{booking.slot_time}</td>
                                            <td className="py-3 px-2 text-gray-600">{booking.service_name}</td>
                                            <td className="py-3 px-2 text-right font-medium text-gray-800">
                                                NT${booking.price?.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className="text-xs font-mono text-gray-400">
                                                    {booking.merchant_trade_no}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 營運分析 — 毛利 / 淨利 */}
            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">營運分析</h2>
                <ProfitDashboard />
            </div>
        </div>
    );
}
