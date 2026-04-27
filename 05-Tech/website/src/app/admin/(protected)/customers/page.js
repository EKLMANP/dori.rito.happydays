'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { CONVERSION_STATUSES, CONVERSION_BADGE_STYLES } from '@/lib/order-status';

function StatusBadge({ status }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CONVERSION_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
            {status || '未開始'}
        </span>
    );
}

function CourseProgress({ customer }) {
    if (customer.conversionStatus !== '進行中' || !customer.purchasedSessions) {
        return <span className="text-gray-400">-</span>;
    }
    return (
        <span className="text-gray-700">
            {customer.usedSessions ?? 0}/{customer.purchasedSessions}
            <span className="text-gray-500">（剩 {customer.remainingSessions ?? 0}）</span>
        </span>
    );
}

function CustomerFormInline({ onCreated, onCancel }) {
    const [form, setForm] = useState({
        name: '', dogName: '', phone: '', email: '', address: '', notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [dedupWarning, setDedupWarning] = useState('');
    const [confirmCreate, setConfirmCreate] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('客戶姓名為必填'); return; }
        setConfirmCreate(true);
    };

    const handleCreateConfirm = async (notes) => {
        setSaving(true);
        setError('');
        setDedupWarning('');
        try {
            const body = { ...form };
            if (notes) body.notes = (body.notes ? body.notes + '\n' : '') + notes;
            const res = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '建立失敗');
            if (data.created === false) {
                setDedupWarning('此客戶可能已存在，請確認是否為重複資料。');
            }
            setConfirmCreate(false);
            onCreated(data.customer || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-900">新增客戶</h3>
                <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">取消</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input name="name" value={form.name} onChange={handleChange} placeholder="客戶姓名 *" required
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input name="dogName" value={form.dogName} onChange={handleChange} placeholder="狗狗名字"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="聯絡手機"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input name="email" value={form.email} onChange={handleChange} placeholder="Email"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input name="address" value={form.address} onChange={handleChange} placeholder="地址"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="備註" rows={2}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {dedupWarning && <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">{dedupWarning}</p>}
                <div className="mt-3">
                    <button type="submit" disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                        {saving ? '儲存中...' : '儲存客戶'}
                    </button>
                </div>
            </form>

            <ConfirmDialog
                open={confirmCreate}
                title="新增客戶"
                variant="default"
                confirmLabel="確認新增"
                onConfirm={handleCreateConfirm}
                onCancel={() => setConfirmCreate(false)}
            >
                <p>確認要新增以下客戶嗎？</p>
                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                    <p><strong>姓名</strong>：{form.name}</p>
                    {form.phone && <p><strong>電話</strong>：{form.phone}</p>}
                    {form.email && <p><strong>Email</strong>：{form.email}</p>}
                    {form.dogName && <p><strong>狗狗名字</strong>：{form.dogName}</p>}
                </div>
            </ConfirmDialog>
        </div>
    );
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchCustomers = useCallback(async (nextCursor = null, append = false) => {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        try {
            const params = new URLSearchParams({ pageSize: '20' });
            if (statusFilter) params.set('status', statusFilter);
            if (nextCursor) params.set('cursor', nextCursor);
            const res = await fetch(`/api/admin/customers?${params}`);
            const data = await res.json();
            if (!res.ok) { console.error('API error:', data.error); return; }
            setCustomers((prev) => append ? [...prev, ...(data.customers || [])] : (data.customers || []));
            setHasMore(data.hasMore || false);
            setCursor(data.nextCursor || null);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            fetchCustomers();
        }
    }, [fetchCustomers, searchQuery]);

    const handleSearch = async () => {
        const q = searchQuery.trim();
        if (!q) { fetchCustomers(); return; }
        setSearching(true);
        try {
            const res = await fetch('/api/admin/customers/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q }),
            });
            const data = await res.json();
            if (!res.ok) { console.error('API error:', data.error); return; }
            setCustomers(data.customers || []);
            setHasMore(false);
            setCursor(null);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleCustomerCreated = (customer) => {
        // Avoid duplicates: replace if exists, prepend if new
        setCustomers((prev) => {
            const exists = prev.some((c) => c.id === customer.id);
            if (exists) return prev;
            return [customer, ...prev];
        });
        setShowForm(false);
    };

    if (loading) return <PageSkeleton />;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
                <button onClick={() => setShowForm((v) => !v)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                    + 新增客戶
                </button>
            </div>

            {showForm && (
                <CustomerFormInline onCreated={handleCustomerCreated} onCancel={() => setShowForm(false)} />
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 flex gap-2">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="搜尋客戶姓名、電話、狗狗名字..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSearch} disabled={searching}
                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50">
                        {searching ? '搜尋中...' : '搜尋'}
                    </button>
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">全部狀態</option>
                    {CONVERSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Customer Table */}
            <div className="bg-white rounded-lg border border-gray-200">
                {customers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600">客戶姓名</th>
                                    <th className="px-4 py-2 text-left text-gray-600">狗狗名字</th>
                                    <th className="px-4 py-2 text-left text-gray-600">聯絡手機</th>
                                    <th className="px-4 py-2 text-left text-gray-600">訂單數</th>
                                    <th className="px-4 py-2 text-left text-gray-600">總消費</th>
                                    <th className="px-4 py-2 text-left text-gray-600">課堂進度</th>
                                    <th className="px-4 py-2 text-left text-gray-600">轉換狀態</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/customers/${c.id}`} className="text-blue-600 hover:underline font-medium">
                                                {c.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{c.dogName || '-'}</td>
                                        <td className="px-4 py-3 text-gray-700">{c.phone || '-'}</td>
                                        <td className="px-4 py-3 text-gray-700">{c.orderCount ?? 0}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {c.totalSpent != null ? `$${c.totalSpent.toLocaleString()}` : '$0'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <CourseProgress customer={c} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={c.conversionStatus} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="px-4 py-8 text-center text-gray-500">找不到符合條件的客戶</p>
                )}
            </div>

            {/* Load More */}
            {hasMore && (
                <div className="mt-4 text-center">
                    <button onClick={() => fetchCustomers(cursor, true)} disabled={loadingMore}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                        {loadingMore ? '載入中...' : '載入更多'}
                    </button>
                </div>
            )}
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-40 mb-6" />
            <div className="flex gap-3 mb-4">
                <div className="flex-1 h-10 bg-gray-200 rounded" />
                <div className="w-32 h-10 bg-gray-200 rounded" />
                <div className="w-32 h-10 bg-gray-200 rounded" />
            </div>
            <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
    );
}
