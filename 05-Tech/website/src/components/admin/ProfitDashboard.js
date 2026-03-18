'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAdminPin } from './AdminPinGate';

const MonthlyChart = dynamic(() => import('./MonthlyChart'), { ssr: false });

function SummaryCard({ label, value, subtext, color = 'gray' }) {
    const colorMap = {
        green: 'bg-green-50 text-green-700',
        orange: 'bg-orange-50 text-orange-700',
        indigo: 'bg-indigo-50 text-indigo-700',
        gray: 'bg-gray-50 text-gray-700',
    };
    return (
        <div className={`rounded-xl p-4 ${colorMap[color]}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-xl font-bold">${value?.toLocaleString()}</p>
            {subtext && <p className="text-xs mt-0.5 opacity-70">{subtext}</p>}
        </div>
    );
}

export default function ProfitDashboard() {
    const { adminFetch } = useAdminPin();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await adminFetch('/api/admin/profit-dashboard?months=6');
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [adminFetch]);

    if (loading) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm">
                載入營運數據中...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500 text-sm">
                載入失敗：{error}
            </div>
        );
    }

    const months = data?.months || [];
    const current = months[months.length - 1];

    if (!current) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm">
                尚無營運數據
            </div>
        );
    }

    const trainers = Object.entries(current.byTrainer || {});

    return (
        <div className="space-y-4">
            {/* 摘要卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryCard
                    label="本月營收"
                    value={current.revenue}
                    color="green"
                />
                <SummaryCard
                    label="毛利"
                    value={current.grossProfit}
                    subtext={current.revenue > 0 ? `${current.grossMargin}%` : ''}
                    color="orange"
                />
                <SummaryCard
                    label="淨利"
                    value={current.netProfit}
                    subtext={current.revenue > 0 ? `${current.netMargin}%` : ''}
                    color="indigo"
                />
            </div>

            {/* 月趨勢圖 */}
            <MonthlyChart data={months} />

            {/* 訓練師拆分 */}
            {trainers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">訓練師拆分（本月）</h3>
                    <div className="space-y-3">
                        {trainers.map(([name, stats]) => (
                            <div key={name} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{name}</p>
                                    <p className="text-xs text-gray-400">{stats.lessons} 堂課</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-green-600">+${stats.revenue?.toLocaleString()}</p>
                                    <p className="text-xs text-orange-500">-${stats.costs?.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 成本明細 */}
            {current.totalCosts > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">成本明細（本月）</h3>
                    <div className="space-y-2 text-sm">
                        <CostRow label="停車費" value={current.costBreakdown.parking} total={current.totalCosts} />
                        <CostRow label="交通費" value={current.costBreakdown.transport} total={current.totalCosts} />
                        <CostRow label="通勤成本" value={current.costBreakdown.commute} total={current.totalCosts} />
                        {data.config.monthlyOverhead > 0 && (
                            <CostRow label="固定成本" value={data.config.monthlyOverhead} total={current.totalCosts + data.config.monthlyOverhead} />
                        )}
                    </div>
                </div>
            )}

            {/* 課堂數 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">本月課堂數</p>
                <p className="text-3xl font-bold text-gray-900">{current.lessonCount}</p>
            </div>
        </div>
    );
}

function CostRow({ label, value, total }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-gray-500 w-16 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                    className="bg-orange-400 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-gray-700 font-medium w-20 text-right">
                ${value?.toLocaleString()} <span className="text-gray-400 text-xs">({pct}%)</span>
            </span>
        </div>
    );
}
