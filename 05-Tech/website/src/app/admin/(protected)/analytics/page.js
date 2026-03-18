'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import AnalyticsTabs from '@/components/admin/AnalyticsTabs';
import StatCard from '@/components/admin/StatCard';
import PlaceholderCard from '@/components/admin/PlaceholderCard';
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart';
import SimplePieChart from '@/components/admin/charts/SimplePieChart';

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

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="預約完成率"
                    value={loading ? '—' : `${data?.completionRate?.rate ?? 0}%`}
                    subtitle={loading ? '' : `${data?.completionRate?.completed ?? 0} / ${data?.completionRate?.total ?? 0}`}
                    icon="✅"
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="平均提前天數"
                    value={loading ? '—' : `${data?.avgDaysAhead ?? 0} 天`}
                    subtitle="付款到上課"
                    icon="📆"
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="熱門服務"
                    value={loading ? '—' : data?.serviceBreakdown?.[0]?.service ?? '—'}
                    subtitle={loading ? '' : `${data?.serviceBreakdown?.[0]?.count ?? 0} 筆`}
                    icon="🏆"
                    color="orange"
                    loading={loading}
                />
                <StatCard
                    title="熱門時段"
                    value={loading ? '—' : data?.timeSlotHeat?.[0]?.timeSlot ?? '—'}
                    subtitle={loading ? '' : `${data?.timeSlotHeat?.[0]?.count ?? 0} 筆預約`}
                    icon="⏰"
                    color="purple"
                    loading={loading}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">服務預約佔比</h3>
                    <SimplePieChart
                        data={data?.serviceBreakdown || []}
                        nameKey="service"
                        valueKey="count"
                        height={260}
                        loading={loading}
                    />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">時段預約熱度</h3>
                    <SimpleBarChart
                        data={data?.timeSlotHeat || []}
                        xKey="timeSlot"
                        yKey="count"
                        color="#8B5CF6"
                        height={260}
                        yLabel="筆"
                        loading={loading}
                    />
                </div>
            </div>

            {/* Upcoming Bookings Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">未來 7 天預約</h3>
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

// ─────────────────────────────────────────────
// Finance Tab
// ─────────────────────────────────────────────
function FinanceTab() {
    const { data, loading, error } = useTabData('finance');

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="客單價"
                    value={loading ? '—' : `NT$${(data?.avgPrice ?? 0).toLocaleString()}`}
                    subtitle="平均每筆訂單"
                    icon="💵"
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="本期營收"
                    value={loading ? '—' : `NT$${(data?.monthlyTrend?.slice(-1)[0]?.revenue ?? 0).toLocaleString()}`}
                    subtitle={data?.monthlyTrend?.slice(-1)[0]?.label || ''}
                    icon="📈"
                    color="orange"
                    loading={loading}
                />
                <StatCard
                    title="未付款訂單"
                    value={loading ? '—' : data?.unpaidOrders?.length ?? 0}
                    subtitle="筆待處理"
                    icon="⚠️"
                    color="red"
                    loading={loading}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">月度營收趨勢（近 6 個月）</h3>
                    <SimpleBarChart
                        data={data?.monthlyTrend || []}
                        xKey="month"
                        yKey="revenue"
                        color="#10B981"
                        height={260}
                        yLabel="元"
                        loading={loading}
                    />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">各服務營收佔比</h3>
                    <SimplePieChart
                        data={data?.serviceRevenue || []}
                        nameKey="service"
                        valueKey="revenue"
                        height={260}
                        loading={loading}
                    />
                </div>
            </div>

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

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

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
                />
                <StatCard
                    title="已付款"
                    value={loading ? '—' : data?.statusBreakdown?.find((s) => s.status === '已付款')?.count ?? 0}
                    subtitle="筆付款紀錄"
                    icon="✅"
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="服務類別數"
                    value={loading ? '—' : data?.serviceBreakdown?.length ?? 0}
                    subtitle="種不同服務"
                    icon="🏷️"
                    color="blue"
                    loading={loading}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">客戶付款狀態分布</h3>
                    <SimplePieChart
                        data={data?.statusBreakdown || []}
                        nameKey="status"
                        valueKey="count"
                        height={260}
                        loading={loading}
                    />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">付費服務類別分布</h3>
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
                <h3 className="text-sm font-semibold text-gray-700 mb-4">近期客戶</h3>
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
// MKT Tab (Phase 1 Placeholder)
// ─────────────────────────────────────────────
function MKTTab() {
    const { data, loading } = useTabData('mkt');

    if (loading) {
        return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;
    }

    return (
        <div className="space-y-6">
            <PlaceholderCard
                title="電子報 & 交易信統計"
                phase="Phase 2"
                message="整合 Ghost CMS + Mailgun 統計數據"
                upcoming={data?.availableInPhase2 || []}
            />
            <PlaceholderCard
                title="網站流量分析"
                phase="Phase 3"
                message="串接 GA4 API，追蹤流量與轉換率"
                upcoming={data?.availableInPhase3 || []}
            />
        </div>
    );
}

// ─────────────────────────────────────────────
// Tech Tab
// ─────────────────────────────────────────────
function TechTab() {
    const { data, loading, error } = useTabData('tech');

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Service Health */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">服務健康狀態</h3>
                {loading ? (
                    <SkeletonRows count={4} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data?.services?.map((svc) => (
                            <div
                                key={svc.key}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`w-3 h-3 rounded-full ${
                                            svc.status === 'ok' ? 'bg-green-400' : 'bg-red-400'
                                        }`}
                                    />
                                    <span className="text-sm font-medium text-gray-700">{svc.label}</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {svc.responseMs}ms
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
                    <h1 className="text-2xl font-bold text-gray-800">營運分析</h1>
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
