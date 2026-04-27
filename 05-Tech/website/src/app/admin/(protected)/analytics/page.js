'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import AnalyticsTabs from '@/components/admin/AnalyticsTabs';
import StatCard, { MetricTooltip } from '@/components/admin/StatCard';
import PlaceholderCard from '@/components/admin/PlaceholderCard';
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart';
import SimplePieChart from '@/components/admin/charts/SimplePieChart';
import SimpleLineChart from '@/components/admin/charts/SimpleLineChart';
import FunnelChart from '@/components/admin/charts/FunnelChart';
import TimePeriodSelector from '@/components/admin/TimePeriodSelector';
import SetupGuideCard from '@/components/admin/SetupGuideCard';

/** Cache loaded tab data to avoid re-fetching on tab switch */
const tabDataCache = {};

function useTabData(tabKey) {
    const [data, setData] = useState(tabDataCache[tabKey] || null);
    const [loading, setLoading] = useState(!tabDataCache[tabKey]);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        // Use cache if available
        if (tabDataCache[tabKey]) {
            setData(tabDataCache[tabKey]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/analytics/${tabKey}`);
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const json = await res.json();
            tabDataCache[tabKey] = json;
            setData(json);
        } catch (err) {
            console.error(`[Analytics ${tabKey}] Failed:`, err);
            setError('資料載入失敗');
        }
        setLoading(false);
    }, [tabKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = useCallback(() => {
        delete tabDataCache[tabKey];
        setData(null);
        fetchData();
    }, [tabKey, fetchData]);

    return { data, loading, error, refresh };
}

// ─────────────────────────────────────────────
// Operations Tab
// ─────────────────────────────────────────────
function OpsTab() {
    const { data, loading, error } = useTabData('ops');
    const q = data?.qualityMetrics;

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Alerts */}
            <AlertsPanel alerts={data?.alerts} loading={loading} />

            {/* ① 今日重點 4 卡 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="今日預約數"
                    value={loading ? '—' : data?.todayStats?.bookings ?? 0}
                    subtitle="今天上課筆數"
                    icon="📅"
                    color="blue"
                    loading={loading}
                    tooltip="今天日期對應 slotDate 的已建立訂單總數（包含已付款與待付款）。"
                />
                <StatCard
                    title="未指派教練"
                    value={loading ? '—' : data?.todayStats?.unassigned ?? 0}
                    subtitle="待確認排課"
                    icon="👤"
                    color={(!loading && (data?.todayStats?.unassigned ?? 0) > 0) ? 'red' : 'green'}
                    loading={loading}
                    tooltip="已付款但尚未指定負責教練（trainer 欄位為空）的未來預約訂單數。需盡快完成排課。"
                />
                <StatCard
                    title="待付款"
                    value={loading ? '—' : data?.todayStats?.pendingPayment ?? 0}
                    subtitle="今日未付款訂單"
                    icon="💳"
                    color="orange"
                    loading={loading}
                    tooltip="今日預約中，processed_at 為空（尚未完成付款）的訂單數。"
                />
                <StatCard
                    title="取消筆數"
                    value={loading ? '—' : data?.todayStats?.cancellations ?? 0}
                    subtitle="今日取消（追蹤中）"
                    icon="❌"
                    color="purple"
                    loading={loading}
                    tooltip="今日已取消的預約數。目前為追蹤規劃中，暫顯示為 0。"
                />
            </div>

            {/* ② 核心 KPI 4 卡（保留） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="預約完成率"
                    value={loading ? '—' : `${data?.completionRate?.rate ?? 0}%`}
                    subtitle={loading ? '' : `${data?.completionRate?.completed ?? 0} / ${data?.completionRate?.total ?? 0}`}
                    icon="✅"
                    color="green"
                    loading={loading}
                    tooltip="已付款訂單數 ÷ 全部訂單數 × 100%。反映訂單從建立到付款完成的成功比例。"
                />
                <StatCard
                    title="平均提前天數"
                    value={loading ? '—' : `${data?.avgDaysAhead ?? 0} 天`}
                    subtitle="付款到上課"
                    icon="📆"
                    color="blue"
                    loading={loading}
                    tooltip="所有已付款訂單中，付款日（processed_at）到上課日（slotDate）的平均天數差。數值越高代表客戶越提早預約。"
                />
                <StatCard
                    title="熱門服務"
                    value={loading ? '—' : data?.serviceBreakdown?.[0]?.service ?? '—'}
                    subtitle={loading ? '' : `${data?.serviceBreakdown?.[0]?.count ?? 0} 筆`}
                    icon="🏆"
                    color="orange"
                    loading={loading}
                    tooltip="所有已付款訂單中，被預約次數最多的服務名稱（依 serviceName 欄位分組計算）。"
                />
                <StatCard
                    title="熱門時段"
                    value={loading ? '—' : data?.timeSlotHeat?.[0]?.timeSlot ?? '—'}
                    subtitle={loading ? '' : `${data?.timeSlotHeat?.[0]?.count ?? 0} 筆預約`}
                    icon="⏰"
                    color="purple"
                    loading={loading}
                    tooltip="所有已付款訂單中，預約人數最多的課程時段（依 slotTime 欄位分組計算）。"
                />
            </div>

            {/* ③ 容量利用率 Heatmap */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    容量利用率 — 未來 14 天 × 時段
                    <MetricTooltip text="未來 14 天每個日期 × 時段的預約數熱圖。綠色＝尚有空位，黃色＝即將額滿，紅色＝接近滿額（相對於同期最高值）。" />
                </h3>
                {loading ? (
                    <SkeletonRows count={4} />
                ) : (
                    <BookingHeatmap data={data?.heatmap14d || []} />
                )}
            </div>

            {/* ④ 預約品質 4 卡 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 mb-1">取消率 <MetricTooltip text="取消的訂單 ÷ 全部訂單 × 100%。目前為追蹤規劃中，暫顯示 0%。" /></p>
                    <p className="text-2xl font-bold text-gray-800">{loading ? '—' : `${q?.cancellationRate ?? 0}%`}</p>
                    <p className="text-xs text-gray-400 mt-1">追蹤中</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 mb-1">改期率 <MetricTooltip text="要求改期的訂單 ÷ 全部訂單 × 100%。目前為追蹤規劃中，暫顯示 0%。" /></p>
                    <p className="text-2xl font-bold text-gray-800">{loading ? '—' : `${q?.rescheduleRate ?? 0}%`}</p>
                    <p className="text-xs text-gray-400 mt-1">追蹤中</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 mb-1">No-show 率 <MetricTooltip text="已付款預約但上課當天實際未出席的比例。目前為追蹤規劃中，暫顯示 0%。" /></p>
                    <p className="text-2xl font-bold text-gray-800">{loading ? '—' : `${q?.noShowRate ?? 0}%`}</p>
                    <p className="text-xs text-gray-400 mt-1">追蹤中</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 mb-1">複購率 <MetricTooltip text="所有付款客戶中，擁有超過 1 筆已付款訂單的客戶比例。計算方式：重複購買客戶數 ÷ 總客戶數 × 100%。" /></p>
                    <p className={`text-2xl font-bold ${(!loading && (q?.repurchaseRate ?? 0) >= 30) ? 'text-green-600' : 'text-amber-600'}`}>
                        {loading ? '—' : `${q?.repurchaseRate ?? 0}%`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">有 &gt;1 筆訂單客戶</p>
                </div>
            </div>

            {/* ⑤ 服務組合 + 線上 vs 線下 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        服務預約佔比
                        <MetricTooltip text="各服務名稱的已付款預約筆數佔全部已付款訂單的比例。" />
                    </h3>
                    <SimplePieChart
                        data={data?.serviceBreakdown || []}
                        nameKey="service"
                        valueKey="count"
                        height={260}
                        loading={loading}
                    />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        線上 vs 線下
                        <MetricTooltip text="服務名稱含「線上」或「online」字樣歸類為線上，其餘歸類為線下。" />
                    </h3>
                    {loading ? (
                        <SkeletonRows count={3} />
                    ) : !data?.onlineOfflineBreakdown?.length ? (
                        <EmptyState text="暫無分類資料" />
                    ) : (
                        <div className="space-y-4 mt-6">
                            {data.onlineOfflineBreakdown.map((item, i) => {
                                const total = data.onlineOfflineBreakdown.reduce((s, x) => s + x.count, 0);
                                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                const colors = ['#6366F1', '#F59E0B'];
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-gray-700">{item.type}</span>
                                            <span className="text-gray-500">{item.count} 筆 ({pct}%)</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ⑥ 流程健康清單 */}
            {!loading && (data?.pendingAssignmentOrders?.length > 0 || data?.slaOverdueOrders?.length > 0) && (
                <div className="space-y-4">
                    {/* Unassigned Orders */}
                    {data?.pendingAssignmentOrders?.length > 0 && (
                        <div className="bg-white rounded-xl border border-red-200 p-6">
                            <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
                                🚨 未指派教練的訂單
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                                    {data.pendingAssignmentOrders.length}
                                </span>
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">客戶</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">服務</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">上課日期</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">時間</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">訂單編號</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.pendingAssignmentOrders.map((o, i) => (
                                            <tr key={i} className="border-b border-gray-50 bg-red-50/50 hover:bg-red-50">
                                                <td className="py-2 px-2 font-medium text-gray-800">{o.customerName}</td>
                                                <td className="py-2 px-2 text-gray-600">{o.serviceName}</td>
                                                <td className="py-2 px-2 text-gray-600">{o.slotDate}</td>
                                                <td className="py-2 px-2 text-gray-600">{o.slotTime}</td>
                                                <td className="py-2 px-2 font-mono text-xs text-gray-400">{o.tradeNo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SLA Overdue Orders */}
                    {data?.slaOverdueOrders?.length > 0 && (
                        <div className="bg-white rounded-xl border border-amber-200 p-6">
                            <h3 className="text-sm font-semibold text-amber-700 mb-4 flex items-center gap-2">
                                ⚠️ 超過 SLA（付款逾 4 小時未確認）
                                <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full">
                                    {data.slaOverdueOrders.length}
                                </span>
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">客戶</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">服務</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-medium">上課日期</th>
                                            <th className="text-right py-2 px-2 text-gray-500 font-medium">等待時數</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.slaOverdueOrders.map((o, i) => (
                                            <tr key={i} className="border-b border-gray-50 bg-amber-50/50 hover:bg-amber-50">
                                                <td className="py-2 px-2 font-medium text-gray-800">{o.customerName}</td>
                                                <td className="py-2 px-2 text-gray-600">{o.serviceName}</td>
                                                <td className="py-2 px-2 text-gray-600">{o.slotDate}</td>
                                                <td className="py-2 px-2 text-right font-bold text-amber-700">{o.hoursSincePaid}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ⑦ 未來 7 天預約 table（保留） */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    未來 7 天預約
                    <MetricTooltip text="slotDate 落在今日到 7 天後之間的已付款預約清單，依日期與時間升序排列。" />
                </h3>
                {loading ? (
                    <SkeletonRows count={3} />
                ) : !data?.upcomingBookings?.length ? (
                    <EmptyState text="未來 7 天沒有預約" />
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
                                </tr>
                            </thead>
                            <tbody>
                                {data.upcomingBookings.map((b, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 font-medium text-gray-800">{b.customer_name}</td>
                                        <td className="py-3 px-2 text-gray-600">{b.dog_name || '—'}</td>
                                        <td className="py-3 px-2 text-gray-600">{b.slot_date}</td>
                                        <td className="py-3 px-2 text-gray-600">{b.slot_time}</td>
                                        <td className="py-3 px-2 text-gray-600">{b.service_name}</td>
                                        <td className="py-3 px-2 text-right font-medium text-gray-800">
                                            NT${b.price?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

/** 14-day × hour booking heatmap */
function BookingHeatmap({ data }) {
    if (!data.length) return <EmptyState text="未來 14 天暫無預約資料" />;

    // Build date × hour matrix
    const dates = [...new Set(data.map((d) => d.slotDate))].sort();
    const hours = [...new Set(data.map((d) => d.hour))].sort();
    const map = {};
    data.forEach(({ slotDate, hour, count }) => {
        map[`${slotDate}_${hour}`] = count;
    });
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    const cellColor = (count) => {
        if (!count) return 'bg-gray-50 text-gray-300';
        const ratio = count / maxCount;
        if (ratio >= 0.8) return 'bg-red-400 text-white';
        if (ratio >= 0.5) return 'bg-amber-300 text-gray-800';
        return 'bg-green-200 text-gray-700';
    };

    return (
        <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
                <thead>
                    <tr>
                        <th className="py-1 px-2 text-gray-400 font-normal text-left w-12">時段</th>
                        {dates.map((d) => (
                            <th key={d} className="py-1 px-1 text-gray-500 font-medium text-center min-w-[52px]">
                                {d.slice(5)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {hours.map((h) => (
                        <tr key={h}>
                            <td className="py-1 px-2 text-gray-500 font-medium">{h}:00</td>
                            {dates.map((d) => {
                                const count = map[`${d}_${h}`] || 0;
                                return (
                                    <td key={d} className="py-0.5 px-1 text-center">
                                        <div className={`rounded text-center py-1 px-1 font-medium ${cellColor(count)}`}>
                                            {count || '·'}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> 尚有空位</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300 inline-block" /> 即將額滿</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> 接近滿額</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Finance Tab
// ─────────────────────────────────────────────

const FINANCE_PERIOD_OPTIONS = [
    { key: 'month', label: '月' },
    { key: 'quarter', label: '季' },
    { key: 'year', label: '年' },
];

const SERVICE_COLORS = ['#F75000', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4'];

function useFinanceTrendData(period) {
    const cacheKey = `finance_trend_${period}`;
    const [data, setData] = useState(tabDataCache[cacheKey] || null);
    const [loading, setLoading] = useState(!tabDataCache[cacheKey]);

    useEffect(() => {
        if (tabDataCache[cacheKey]) { setData(tabDataCache[cacheKey]); setLoading(false); return; }
        setLoading(true);
        fetch(`/api/admin/analytics/finance?section=trend&period=${period}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((json) => { tabDataCache[cacheKey] = json; setData(json); })
            .catch((e) => console.error('[Finance Trend]', e))
            .finally(() => setLoading(false));
    }, [period, cacheKey]);

    return { data, loading };
}

function FinanceTab() {
    const { data, loading, error } = useTabData('finance');
    const [trendPeriod, setTrendPeriod] = useState('month');
    const [mixView, setMixView] = useState('pct'); // 'pct' | 'revenue'
    const { data: trendData, loading: trendLoading } = useFinanceTrendData(trendPeriod);

    const serviceLines = (trendData?.services || []).map((svc, i) => ({
        key: svc,
        label: svc,
        color: SERVICE_COLORS[i % SERVICE_COLORS.length],
    }));

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Alerts */}
            <AlertsPanel alerts={data?.alerts} loading={loading} />

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="客單價"
                    value={loading ? '—' : `NT$${(data?.avgPrice ?? 0).toLocaleString()}`}
                    subtitle="平均每筆訂單"
                    icon="💵"
                    color="green"
                    loading={loading}
                    tooltip="所有已付款訂單的平均金額。計算方式：已付款總金額 ÷ 已付款訂單筆數。"
                />
                <StatCard
                    title="本期營收"
                    value={loading ? '—' : `NT$${(data?.monthlyTrend?.slice(-1)[0]?.revenue ?? 0).toLocaleString()}`}
                    subtitle={loading ? '' : (() => {
                        const chg = data?.revenueMomChange;
                        if (chg == null) return data?.monthlyTrend?.slice(-1)[0]?.label || '';
                        const sign = chg >= 0 ? '+' : '';
                        return `${data?.monthlyTrend?.slice(-1)[0]?.label || ''} (${sign}${chg}% MoM)`;
                    })()}
                    icon="📈"
                    color="orange"
                    loading={loading}
                    tooltip="本月（依 processed_at 日期）所有已付款訂單的金額加總。括號顯示與上個月的環比漲跌幅（MoM）。"
                />
                <StatCard
                    title="預收款項"
                    value={loading ? '—' : `NT$${(data?.deferredRevenue ?? 0).toLocaleString()}`}
                    subtitle="已付款未上課"
                    icon="🗓️"
                    color="blue"
                    loading={loading}
                    tooltip="已付款但 slotDate 尚未到來的訂單金額總計（Deferred Revenue）。代表未來須履行的課程服務義務。"
                />
                <StatCard
                    title="未付款訂單"
                    value={loading ? '—' : data?.unpaidOrders?.length ?? 0}
                    subtitle={loading ? '' : `逾 72h: ${data?.unpaidAging?.over72h ?? 0} 筆`}
                    icon="⚠️"
                    color="red"
                    loading={loading}
                    tooltip="processed_at 為空（尚未付款）的訂單筆數。逾 72 小時未付款的訂單需優先追蹤聯繫。"
                />
            </div>

            {/* ① 營收趨勢 — Line Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                        營收趨勢
                        <MetricTooltip text="依 processed_at 分組計算的已付款訂單營收趨勢。月＝近 12 個月；季＝近 2 年；年＝歷年全部。" />
                    </h3>
                    <TimePeriodSelector
                        value={trendPeriod}
                        onChange={setTrendPeriod}
                        options={FINANCE_PERIOD_OPTIONS}
                    />
                </div>
                <SimpleLineChart
                    data={trendData?.revenueTrend || []}
                    xKey="label"
                    lines={[{ key: 'revenue', label: '營收', color: '#F75000' }]}
                    height={260}
                    yLabel=" 元"
                    loading={trendLoading}
                />
            </div>

            {/* ② 各服務營收佔比趨勢 — Multi-line */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                        各服務營收佔比趨勢
                        <MetricTooltip text="每個時間區間內各服務的營收佔比（%）或絕對金額趨勢。可切換「佔比」與「金額」視角，以判斷各服務的成長或消退。" />
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* 佔比 / 金額 toggle */}
                        <div className="inline-flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                            {[{ key: 'pct', label: '佔比' }, { key: 'revenue', label: '金額' }].map((v) => (
                                <button
                                    key={v.key}
                                    onClick={() => setMixView(v.key)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        mixView === v.key ? 'bg-white text-brand-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                        <TimePeriodSelector
                            value={trendPeriod}
                            onChange={setTrendPeriod}
                            options={FINANCE_PERIOD_OPTIONS}
                        />
                    </div>
                </div>
                <SimpleLineChart
                    data={mixView === 'pct' ? (trendData?.serviceMixTrend || []) : (trendData?.serviceMixRevenue || [])}
                    xKey="label"
                    lines={serviceLines}
                    height={280}
                    yLabel={mixView === 'pct' ? '%' : ' 元'}
                    loading={trendLoading}
                />
            </div>

            {/* Unit Economics Table */}
            {!loading && data?.serviceUnitEcon?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        各服務單位經濟
                        <MetricTooltip text="按服務名稱分組顯示：訂單筆數、已付款總營收，以及平均客單價（AOV = 總營收 ÷ 筆數）。" />
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">服務</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">筆數</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">總營收</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">平均客單價</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.serviceUnitEcon.map((s, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-3 px-2 text-gray-800">{s.service}</td>
                                        <td className="py-3 px-2 text-right text-gray-600">{s.count}</td>
                                        <td className="py-3 px-2 text-right font-medium text-gray-800">NT${s.totalRevenue?.toLocaleString()}</td>
                                        <td className="py-3 px-2 text-right text-gray-600">NT${s.avgPrice?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Unpaid Orders Table */}
            {data?.unpaidOrders?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        未付款訂單
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            {data.unpaidOrders.length}
                        </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">客戶</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">服務</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">預約日期</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">金額</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">訂單編號</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.unpaidOrders.map((o) => (
                                    <tr key={o.merchant_trade_no} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 font-medium text-gray-800">{o.customer_name}</td>
                                        <td className="py-3 px-2 text-gray-600">{o.service_name}</td>
                                        <td className="py-3 px-2 text-gray-600">{o.slot_date || '—'}</td>
                                        <td className="py-3 px-2 text-right font-medium text-gray-800">
                                            NT${o.price?.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="text-xs font-mono text-gray-400">{o.merchant_trade_no}</span>
                                        </td>
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

// ─────────────────────────────────────────────
// Customer Success Tab
// ─────────────────────────────────────────────
function CSTab() {
    const { data, loading, error } = useTabData('cs');

    const isEnvMissing = !loading && data?.error === 'ENV_MISSING';

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Env Missing Guide */}
            {isEnvMissing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-amber-800 mb-2">⚙️ Notion CRM 尚未設定</p>
                    <p className="text-xs text-amber-700 mb-3">
                        缺少環境變數：{data.missing?.join(', ')}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-amber-700">
                        <li>在 Notion 取得 Integration Token</li>
                        <li>在 Vercel 設定 <code className="bg-amber-100 px-1 rounded">NOTION_API_KEY_CRM</code></li>
                        <li>設定 <code className="bg-amber-100 px-1 rounded">NOTION_CUSTOMER_DB_ID</code> 為客戶資料庫 ID</li>
                        <li>重新部署後重新整理此頁面</li>
                    </ol>
                </div>
            )}

            {/* Alerts */}
            <AlertsPanel alerts={data?.alerts} loading={loading} />

            {/* Customer Search */}
            <CustomerSearch />

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="總客戶數"
                    value={loading ? '—' : data?.totalCustomers ?? 0}
                    subtitle="Notion CRM"
                    icon="👥"
                    color="purple"
                    loading={loading}
                    tooltip="Notion CRM 客戶資料庫（NOTION_CUSTOMER_DB_ID）中的全部記錄筆數，包含各種付款狀態的客戶。"
                />
                <StatCard
                    title="已付款"
                    value={loading ? '—' : data?.statusBreakdown?.find((s) => s.status === '已付款')?.count ?? 0}
                    subtitle="筆付款紀錄"
                    icon="✅"
                    color="green"
                    loading={loading}
                    tooltip="Notion CRM 中「付款狀態」欄位標記為「已付款」的客戶數量。"
                />
                <StatCard
                    title="服務類別數"
                    value={loading ? '—' : data?.serviceBreakdown?.length ?? 0}
                    subtitle="種不同服務"
                    icon="🏷️"
                    color="blue"
                    loading={loading}
                    tooltip="CRM 客戶記錄中出現的不同付費服務類別（multi-select 欄位「付費服務類別」）數量。"
                />
            </div>

            {/* Active / Dormant */}
            {!loading && (data?.activeCustomers != null) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard title="活躍客戶" value={data.activeCustomers} subtitle="90 天內有互動或已付款" icon="🟢" color="green" tooltip="Notion 建立時間在 90 天內，或付款狀態為「已付款」的客戶數（兩者取聯集）。" />
                    <StatCard title="沉睡客戶" value={data.dormantCustomers ?? 0} subtitle="超過 90 天無互動" icon="💤" color="purple" tooltip="Notion 建立時間超過 90 天，且未被歸入活躍客戶的記錄數。可能代表長期未互動的流失風險客戶。" />
                </div>
            )}

            {/* Health Breakdown */}
            {!loading && data?.healthBreakdown && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        客戶健康度分布
                        <MetricTooltip text="健康分數計算：有付款記錄 +40分、有服務類別 +30分、90天內建立 +30分。高≥70、中40-69、低<40。" />
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{data.healthBreakdown.high}</p>
                            <p className="text-xs text-green-600 mt-1">健康（≥70分）</p>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-700">{data.healthBreakdown.medium}</p>
                            <p className="text-xs text-amber-600 mt-1">待關注（40-69分）</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-2xl font-bold text-red-700">{data.healthBreakdown.low}</p>
                            <p className="text-xs text-red-600 mt-1">高風險（&lt;40分）</p>
                        </div>
                    </div>
                </div>
            )}

            {/* At-Risk Customers */}
            {!loading && data?.atRiskCustomers?.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 p-6">
                    <h3 className="text-sm font-semibold text-red-700 mb-4">
                        🚨 高風險客戶（需主動跟進）
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{data.atRiskCustomers.length}</span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">姓名</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">付款狀態</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">服務類別</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">健康分數</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.atRiskCustomers.map((c, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-red-50 transition-colors">
                                        <td className="py-3 px-2 font-medium text-gray-800">{c.name}</td>
                                        <td className="py-3 px-2"><StatusBadge status={c.status} /></td>
                                        <td className="py-3 px-2 text-gray-600 text-xs">{c.services || '—'}</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-xs font-bold text-red-600">{c.healthScore}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        客戶付款狀態分布
                        <MetricTooltip text="依 Notion CRM「付款狀態」欄位分類的客戶數量圓餅圖。" />
                    </h3>
                    <SimplePieChart
                        data={data?.statusBreakdown || []}
                        nameKey="status"
                        valueKey="count"
                        height={260}
                        loading={loading}
                    />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        付費服務類別分布
                        <MetricTooltip text="依 Notion CRM「付費服務類別」multi-select 欄位分類的客戶數量圓餅圖。一位客戶可能對應多個服務類別。" />
                    </h3>
                    <SimplePieChart
                        data={data?.serviceBreakdown || []}
                        nameKey="service"
                        valueKey="count"
                        colors={['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4']}
                        height={260}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Recent Customers Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    近期客戶
                    <MetricTooltip text="依 Notion 建立時間（created_time）降序排列的最近 20 筆客戶記錄。" />
                </h3>
                {loading ? (
                    <SkeletonRows count={5} />
                ) : !data?.recentCustomers?.length ? (
                    <EmptyState text="目前沒有客戶資料" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">姓名</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Email</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">付款狀態</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">服務類別</th>
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">加入時間</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentCustomers.map((c, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 font-medium text-gray-800">{c.name}</td>
                                        <td className="py-3 px-2 text-gray-600">{c.email || '—'}</td>
                                        <td className="py-3 px-2">
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td className="py-3 px-2 text-gray-600">{c.services}</td>
                                        <td className="py-3 px-2 text-gray-400 text-xs">
                                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-TW') : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Customer Search Component
// ─────────────────────────────────────────────
function CustomerSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;

        setSearching(true);
        setSearchError(null);
        try {
            const res = await fetch(`/api/admin/analytics/cs/search?q=${encodeURIComponent(q)}`);
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const json = await res.json();
            setResults(json);
        } catch (err) {
            console.error('[CustomerSearch]', err);
            setSearchError('查詢失敗，請稍後再試');
        }
        setSearching(false);
    };

    const clearSearch = () => {
        setQuery('');
        setResults(null);
        setSearchError(null);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🔍 客戶查詢</h3>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="輸入訂單編號、客戶姓名或手機號碼..."
                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={searching || !query.trim()}
                    className="px-5 py-2.5 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {searching ? '查詢中...' : '查詢'}
                </button>
            </form>

            {searchError && <ErrorBanner message={searchError} />}

            {/* Search Results */}
            {results && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">
                            搜尋「{results.query}」找到 {results.total} 筆結果
                        </p>
                        <button
                            onClick={clearSearch}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            清除結果
                        </button>
                    </div>

                    {results.results.length === 0 ? (
                        <EmptyState text="查無符合的客戶資料" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-2 text-gray-500 font-medium">訂單編號</th>
                                        <th className="text-left py-3 px-2 text-gray-500 font-medium">客戶姓名</th>
                                        <th className="text-left py-3 px-2 text-gray-500 font-medium">手機</th>
                                        <th className="text-left py-3 px-2 text-gray-500 font-medium">服務</th>
                                        <th className="text-right py-3 px-2 text-gray-500 font-medium">付款金額</th>
                                        <th className="text-left py-3 px-2 text-gray-500 font-medium">付款日期時間</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results.map((r) => (
                                        <tr key={r.merchantTradeNo} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2">
                                                <span className="font-mono text-xs text-gray-600">{r.merchantTradeNo}</span>
                                            </td>
                                            <td className="py-3 px-2 font-medium text-gray-800">{r.customerName}</td>
                                            <td className="py-3 px-2 text-gray-600">{r.phone}</td>
                                            <td className="py-3 px-2 text-gray-600">{r.serviceName}</td>
                                            <td className="py-3 px-2 text-right font-medium text-gray-800">
                                                NT${r.price?.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-gray-600">
                                                {formatPaymentDate(r.paymentDate, r.processedAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/** Format ECPay paymentDate (YYYY/MM/DD HH:mm:ss) or fallback to processedAt */
function formatPaymentDate(paymentDate, processedAt) {
    if (paymentDate) return paymentDate;
    if (processedAt) {
        const d = new Date(processedAt);
        return d.toLocaleString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    }
    return '未付款';
}

// ─────────────────────────────────────────────
// MKT Tab — Full Marketing Dashboard
// ─────────────────────────────────────────────

/** Custom hook for MKT data with per-section period support */
function useMktData(section, period) {
    const cacheKey = `mkt_${section}_${period}`;
    const [data, setData] = useState(tabDataCache[cacheKey] || null);
    const [loading, setLoading] = useState(!tabDataCache[cacheKey]);

    useEffect(() => {
        if (tabDataCache[cacheKey]) {
            setData(tabDataCache[cacheKey]);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`/api/admin/analytics/mkt?section=${section}&period=${period}`)
            .then((res) => res.ok ? res.json() : Promise.reject(res.status))
            .then((json) => {
                tabDataCache[cacheKey] = json;
                setData(json);
            })
            .catch((err) => console.error(`[MKT ${section}]`, err))
            .finally(() => setLoading(false));
    }, [section, period, cacheKey]);

    const refresh = useCallback(() => {
        delete tabDataCache[cacheKey];
        setData(null);
        setLoading(true);
    }, [cacheKey]);

    return { data, loading, refresh };
}

function MKTTab() {
    // Each section has its own period state
    const [igPeriod, setIgPeriod] = useState('week');
    const [nlPeriod, setNlPeriod] = useState('week');
    const [webPeriod, setWebPeriod] = useState('week');

    // Fetch config to know which services are set up
    const { data: configData, loading: configLoading } = useTabData('mkt');

    const configured = configData?.configured || {};

    return (
        <div className="space-y-8">
            {/* ── Booking Funnel (Postgres) ── */}
            <MKTBookingFunnelSection />

            {/* ── Instagram Section ── */}
            <MKTInstagramSection period={igPeriod} onPeriodChange={setIgPeriod} configured={configured.instagram} />

            {/* ── Newsletter Section ── */}
            <MKTNewsletterSection period={nlPeriod} onPeriodChange={setNlPeriod} configured={configured.ghost} />

            {/* ── Website / GA4 Section ── */}
            <MKTWebsiteSection period={webPeriod} onPeriodChange={setWebPeriod} configured={configured.ga4} />
        </div>
    );
}

function MKTBookingFunnelSection() {
    const { data, loading } = useMktData('funnel', 'all');

    return (
        <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>🎯</span> 預約轉換漏斗
                <MetricTooltip text="從「建立訂單」→「完成付款」→「已上課」的轉換漏斗，數據來源為 Postgres processed_orders 資料表。" />
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                {loading ? (
                    <SkeletonRows count={3} />
                ) : data?.funnel?.length ? (
                    <div className="space-y-3">
                        {data.funnel.map((step, i) => {
                            const maxCount = data.funnel[0]?.count || 1;
                            const pct = Math.round((step.count / maxCount) * 100);
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700 font-medium">{step.stage}</span>
                                        <span className="text-gray-500">{step.count.toLocaleString()} 筆</span>
                                    </div>
                                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-brand-orange transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        <div className="mt-4 flex gap-6 pt-3 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400">付款轉換率 <MetricTooltip text="完成付款的訂單數 ÷ 建立訂單總數 × 100%。反映預約意願轉化為實際付款的效率。" /></p>
                                <p className="text-lg font-bold text-gray-800">{data.conversionRates?.paymentRate ?? 0}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">課程消費率 <MetricTooltip text="已上課的訂單數 ÷ 完成付款的訂單數 × 100%。反映付款後實際消費課程的比例（以 processed_at 為準）。" /></p>
                                <p className="text-lg font-bold text-gray-800">{data.conversionRates?.consumptionRate ?? 0}%</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <EmptyState text="暫無漏斗資料" />
                )}
            </div>
        </div>
    );
}

function MKTInstagramSection({ period, onPeriodChange, configured }) {
    const { data, loading } = useMktData('instagram', period);
    const ig = data?.instagram;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span>📸</span> Instagram
                </h2>
                <TimePeriodSelector value={period} onChange={onPeriodChange} />
            </div>

            {configured === false ? (
                <SetupGuideCard
                    title="Instagram API 尚未設定"
                    icon="📸"
                    message="需要連結 Facebook Page 才能使用 Instagram Graph API"
                    steps={[
                        '建立或使用現有的 Facebook Page',
                        '在 IG App 設定 → 帳號 → 連結 Facebook Page',
                        '在 Facebook Developer Portal 建立 App',
                        '取得 Long-Lived Access Token',
                        '設定環境變數 IG_ACCESS_TOKEN 和 IG_USER_ID',
                    ]}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <StatCard
                            title="累積粉絲數"
                            value={loading ? '—' : (ig?.totalFollowers ?? 0).toLocaleString()}
                            icon="👥"
                            color="purple"
                            loading={loading}
                            tooltip="Instagram 帳號目前的追蹤人數總計，數據來自 Instagram Graph API followers_count 欄位。"
                        />
                        <StatCard
                            title="24h 新增粉絲"
                            value={loading ? '—' : `+${ig?.newIn24h ?? 0}`}
                            icon="📈"
                            color="green"
                            loading={loading}
                            tooltip="過去 24 小時內新增的 IG 追蹤人數（與昨日快照比較差值）。"
                        />
                        <StatCard
                            title="24h 退追蹤"
                            value={loading ? '—' : `-${ig?.unfollowsIn24h ?? 0}`}
                            icon="📉"
                            color="red"
                            loading={loading}
                            tooltip="過去 24 小時內取消追蹤的人數（與昨日快照比較差值）。"
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">粉絲增長趨勢</h3>
                        <div className="h-[200px] sm:h-[260px]">
                            <SimpleLineChart
                                data={ig?.trend || []}
                                xKey="date"
                                lines={[
                                    { key: 'total_followers', label: '累積粉絲', color: '#8B5CF6' },
                                    { key: 'new_24h', label: '新增', color: '#10B981' },
                                    { key: 'unfollows_24h', label: '退追蹤', color: '#EF4444' },
                                ]}
                                height="100%"
                                loading={loading}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function MKTNewsletterSection({ period, onPeriodChange, configured }) {
    const { data, loading } = useMktData('newsletter', period);
    const nl = data?.newsletter;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span>📧</span> 電子報
                </h2>
                <TimePeriodSelector value={period} onChange={onPeriodChange} />
            </div>

            {configured === false ? (
                <SetupGuideCard
                    title="Ghost Admin API 尚未設定"
                    icon="📧"
                    message="需要 Ghost Admin API Key 才能取得訂閱數據"
                    steps={[
                        '登入 Ghost Admin → Settings → Integrations',
                        '點「+ Add custom integration」',
                        '命名為「Dori Admin Dashboard」',
                        '複製 Admin API Key（格式：{id}:{secret}）',
                        '設為環境變數 GHOST_ADMIN_API_KEY',
                    ]}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard
                            title="累積訂閱數"
                            value={loading ? '—' : (nl?.totalSubscribers ?? 0).toLocaleString()}
                            icon="📬"
                            color="orange"
                            loading={loading}
                            tooltip="Ghost 電子報平台目前的有效訂閱人數（已點擊確認信完成訂閱），數據來自 Ghost Admin API。"
                        />
                        <StatCard
                            title="24h 新增訂閱"
                            value={loading ? '—' : `+${nl?.newIn24h ?? 0}`}
                            icon="📈"
                            color="green"
                            loading={loading}
                            tooltip="過去 24 小時內成功完成訂閱（含確認）的新增人數。"
                        />
                        <StatCard
                            title="24h 退訂"
                            value={loading ? '—' : `-${nl?.unsubIn24h ?? 0}`}
                            icon="📉"
                            color="red"
                            loading={loading}
                            tooltip="過去 24 小時內取消電子報訂閱的人數。退訂率高（>1%/期）需檢視內容相關度與寄送頻率。"
                        />
                        <StatCard
                            title="24h 未確認"
                            value={loading ? '—' : nl?.unconfirmedIn24h ?? 0}
                            icon="⏳"
                            color="amber"
                            loading={loading}
                            tooltip="已提交訂閱申請但尚未點擊確認信（double opt-in）完成訂閱的人數。這些訂閱尚未生效。"
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">訂閱趨勢</h3>
                        <div className="h-[200px] sm:h-[260px]">
                            <SimpleLineChart
                                data={nl?.trend || []}
                                xKey="date"
                                lines={[
                                    { key: 'total_subscribers', label: '累積訂閱', color: '#F75000' },
                                    { key: 'new_24h', label: '新增', color: '#10B981' },
                                    { key: 'unsub_24h', label: '退訂', color: '#EF4444' },
                                ]}
                                height="100%"
                                loading={loading}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function MKTWebsiteSection({ period, onPeriodChange, configured }) {
    const { data, loading } = useMktData('website', period);
    const web = data?.website;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span>🌐</span> 網站流量分析
                </h2>
                <TimePeriodSelector value={period} onChange={onPeriodChange} />
            </div>

            {configured === false ? (
                <SetupGuideCard
                    title="GA4 API 尚未設定"
                    icon="🌐"
                    message="需要 GA4 Property ID 和 Service Account 才能取得流量數據"
                    steps={[
                        '在 Google Analytics 4 取得 Property ID',
                        '建立 Google Cloud Service Account',
                        '在 GA4 Property 加入 Service Account 的 Email',
                        '設定環境變數 GA4_PROPERTY_ID 和 GOOGLE_SERVICE_ACCOUNT_KEY',
                    ]}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <StatCard
                            title="Sessions"
                            value={loading ? '—' : (web?.sessions ?? 0).toLocaleString()}
                            icon="👁️"
                            color="blue"
                            loading={loading}
                            tooltip="GA4 工作階段數：使用者在 30 分鐘內連續的網站互動計為一個 Session。數據來自 GA4 Data API。"
                        />
                        <StatCard
                            title="Users"
                            value={loading ? '—' : (web?.users ?? 0).toLocaleString()}
                            icon="👤"
                            color="purple"
                            loading={loading}
                            tooltip="GA4 使用者數，包含新訪客（New Users）與回訪者（Returning Users），以 Client ID 識別。"
                        />
                        <StatCard
                            title="預約諮詢轉換率"
                            value={loading ? '—' : `${web?.funnel?.conversionRate ?? 0}%`}
                            icon="🎯"
                            color="green"
                            loading={loading}
                            tooltip="網站使用者中最終進入預約諮詢流程的比例。計算方式：表單送出事件數 ÷ 頁面瀏覽數 × 100%。"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">流量來源分布</h3>
                            <div className="h-[200px] sm:h-[260px]">
                                <SimplePieChart
                                    data={web?.trafficSources || []}
                                    nameKey="source"
                                    valueKey="sessions"
                                    height="100%"
                                    loading={loading}
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">部落格文章瀏覽排行</h3>
                            <div className="h-[200px] sm:h-[260px]">
                                <SimpleBarChart
                                    data={(web?.topBlogPosts || []).slice(0, 5).map((p) => ({
                                        title: p.title?.length > 15 ? p.title.slice(0, 15) + '…' : p.title,
                                        views: p.views,
                                    }))}
                                    xKey="title"
                                    yKey="views"
                                    color="#3B82F6"
                                    height="100%"
                                    yLabel="次"
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Booking Funnel */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">預約諮詢轉換漏斗</h3>
                        <FunnelChart
                            steps={web?.funnel ? [
                                { label: '頁面瀏覽', value: web.funnel.pageViews },
                                { label: '點擊預約', value: web.funnel.contactClicks },
                                { label: '表單送出', value: web.funnel.formSubmits },
                            ] : []}
                            loading={loading}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Tech Tab
// ─────────────────────────────────────────────
function TechTab() {
    const { data, loading, error, refresh } = useTabData('tech');

    const allOk = data?.services?.every((s) => s.status === 'ok');
    const hasError = data?.services?.some((s) => s.status === 'error');
    const overallStatus = loading ? null : hasError ? 'error' : allOk ? 'ok' : 'warn';

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Overall Status Banner */}
            {!loading && overallStatus && (
                <div className={`rounded-xl p-5 flex items-center justify-between ${
                    overallStatus === 'ok' ? 'bg-green-50 border border-green-200' :
                    overallStatus === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-amber-50 border border-amber-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full ${
                            overallStatus === 'ok' ? 'bg-green-400' :
                            overallStatus === 'error' ? 'bg-red-500' : 'bg-amber-400'
                        }`} />
                        <div>
                            <p className={`text-sm font-bold ${
                                overallStatus === 'ok' ? 'text-green-700' :
                                overallStatus === 'error' ? 'text-red-700' : 'text-amber-700'
                            }`}>
                                {overallStatus === 'ok' ? '所有系統正常運行' :
                                 overallStatus === 'error' ? '有服務異常，請立即檢查' : '部分服務需要關注'}
                            </p>
                            {data?.lastChecked && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    上次檢查：{new Date(data.lastChecked).toLocaleString('zh-TW')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={refresh}
                        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                    >
                        重新檢查
                    </button>
                </div>
            )}

            {/* Service Health Grid */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    服務健康狀態
                    <MetricTooltip text="對各整合服務發送 API 請求（或檢查環境變數），記錄回應狀態與耗時（毫秒）。正常＝綠色，異常＝紅色閃爍。" />
                </h3>
                {loading ? (
                    <SkeletonRows count={4} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data?.services?.map((svc) => (
                            <div
                                key={svc.key}
                                className={`flex items-center justify-between p-4 rounded-lg ${
                                    svc.status === 'ok' ? 'bg-green-50' : 'bg-red-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${svc.status === 'ok' ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`} />
                                    <span className="text-sm font-medium text-gray-700">{svc.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${svc.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                                        {svc.status === 'ok' ? '正常' : '異常'}
                                    </span>
                                    {svc.responseMs != null && (
                                        <span className="text-xs text-gray-400">{svc.responseMs}ms</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Env Var Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    環境變數完整性
                    <MetricTooltip text="確認 Vercel 執行環境中所有必要的環境變數是否已設定。缺失（紅色）代表對應功能可能無法正常運作。" />
                </h3>
                {loading ? (
                    <SkeletonRows count={4} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data?.envCheck?.map((env) => (
                            <div key={env.key} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${env.present ? 'bg-green-400' : 'bg-red-500'}`} />
                                <span className="text-xs text-gray-700 flex-1">{env.label}</span>
                                <span className={`text-xs font-medium ${env.present ? 'text-green-600' : 'text-red-600'}`}>
                                    {env.present ? '已設定' : '缺失'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* DB Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    資料庫概況
                    <MetricTooltip text="透過 SQL COUNT(*) 取得 Postgres（Neon）各資料表的目前記錄筆數。" />
                    {data?.database?.status && (
                        <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                            {data.database.status}
                        </span>
                    )}
                </h3>
                {loading ? (
                    <SkeletonRows count={4} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Table</th>
                                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Rows</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.database?.tables?.map((t) => (
                                    <tr key={t.name} className="border-b border-gray-50">
                                        <td className="py-3 px-2 font-mono text-gray-700">{t.name}</td>
                                        <td className="py-3 px-2 text-right font-medium text-gray-800">
                                            {t.rows.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Shared tiny components
// ─────────────────────────────────────────────

const SEVERITY_STYLES = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700', label: '緊急' },
    warning:  { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', text: 'text-amber-700', label: '警告' },
    info:     { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', text: 'text-blue-700', label: '提示' },
};

function AlertsPanel({ alerts, loading }) {
    if (loading || !alerts?.length) return null;
    return (
        <div className="space-y-3">
            {alerts.map((a) => {
                const s = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info;
                return (
                    <div key={a.id} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                        <div className="flex items-start gap-3">
                            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
                                    <span className={`text-sm font-medium ${s.text}`}>{a.message}</span>
                                </div>
                                {a.suggestion && (
                                    <p className="text-xs text-gray-600">建議：{a.suggestion}</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ErrorBanner({ message }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{message}</p>
        </div>
    );
}

function SkeletonRows({ count = 3 }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <p className="text-gray-500 text-sm py-8 text-center">{text}</p>
    );
}

function StatusBadge({ status }) {
    const styles = {
        '已付款': 'bg-green-100 text-green-700',
        '未付款': 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}

// ─────────────────────────────────────────────
// Tab Router
// ─────────────────────────────────────────────
const TAB_COMPONENTS = {
    ops: OpsTab,
    finance: FinanceTab,
    cs: CSTab,
    mkt: MKTTab,
    tech: TechTab,
};

// ─────────────────────────────────────────────
// Page (wrapped in Suspense for useSearchParams)
// ─────────────────────────────────────────────
function AnalyticsPageInner() {
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">營運分析</h1>
                    <p className="text-sm text-gray-400 mt-1">深入了解各部門營運數據</p>
                </div>
                <Link
                    href="/admin"
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    ← 回到 Dashboard
                </Link>
            </div>

            {/* Tabs + Content */}
            <AnalyticsTabs
                renderTab={(activeTab) => {
                    const Component = TAB_COMPONENTS[activeTab] || OpsTab;
                    return <Component />;
                }}
            />
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="h-96 bg-gray-50 rounded-xl animate-pulse" />}>
            <AnalyticsPageInner />
        </Suspense>
    );
}
