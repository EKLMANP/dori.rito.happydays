'use client';

import { useState, useCallback } from 'react';

const ACTION_OPTIONS = [
    { value: '', label: '全部' },
    { value: 'create', label: '新增' },
    { value: 'update', label: '修改' },
    { value: 'archive', label: '封存' },
];

const ENTITY_TABS = [
    { value: '', label: '全部' },
    { value: 'customer', label: '客戶管理' },
    { value: 'order', label: '訂單管理' },
    { value: 'service', label: '服務項目' },
];

const ACTION_BADGES = {
    create: { label: '新增', className: 'bg-green-100 text-green-700' },
    update: { label: '修改', className: 'bg-blue-100 text-blue-700' },
    archive: { label: '封存', className: 'bg-red-100 text-red-700' },
};

const ENTITY_LABELS = {
    customer: '客戶管理',
    order: '訂單管理',
    service: '服務項目',
};

function ActionBadge({ action }) {
    const badge = ACTION_BADGES[action] || { label: action, className: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
        </span>
    );
}

/** Build a human-readable description of the operation */
function buildDescription(log) {
    const actionMap = { create: '新增', update: '修改', archive: '封存' };
    const typeMap = { customer: '客戶', order: '訂單', service: '服務項目' };
    const actionLabel = actionMap[log.action] || log.action;
    const typeLabel = typeMap[log.entity_type] || log.entity_type;
    const name = log.entity_name || '';

    let desc = `${actionLabel}${typeLabel}`;
    if (name) desc += `「${name}」`;

    // Append change details for updates
    if (log.action === 'update' && log.changes) {
        const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
        const fields = Object.keys(changes);
        if (fields.length > 0) {
            const details = fields.map(f => {
                const c = changes[f];
                return `${f}: ${c.old ?? '(空)'} → ${c.new ?? '(空)'}`;
            });
            desc += `\n${details.join('\n')}`;
        }
    }

    if (log.notes) {
        desc += `\n備註：${log.notes}`;
    }

    return desc;
}

function formatTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [initialLoad, setInitialLoad] = useState(true);

    // Filters
    const [action, setAction] = useState('');
    const [entityType, setEntityType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const LIMIT = 50;

    const fetchLogs = useCallback(async (newOffset = 0, append = false) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ limit: String(LIMIT), offset: String(newOffset) });
            if (action) params.set('action', action);
            if (entityType) params.set('entityType', entityType);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await fetch(`/api/admin/logs?${params}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const items = data.logs || [];
            setLogs((prev) => append ? [...prev, ...items] : items);
            setHasMore(items.length === LIMIT);
            setOffset(newOffset + items.length);
            setInitialLoad(false);
        } catch (err) {
            setError(err.message || '載入失敗');
        } finally {
            setLoading(false);
        }
    }, [action, entityType, startDate, endDate]);

    const handleSearch = () => {
        setOffset(0);
        fetchLogs(0, false);
    };

    const handleLoadMore = () => {
        fetchLogs(offset, true);
    };

    const handleTabChange = (val) => {
        setEntityType(val);
        // Auto-search when switching tabs (if already loaded once)
        if (!initialLoad) {
            setTimeout(() => {
                setOffset(0);
                // Need to trigger fetch with new entityType
            }, 0);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">操作紀錄</h1>

            {/* Entity Type Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
                {ENTITY_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => {
                            setEntityType(tab.value);
                            if (!initialLoad) {
                                setOffset(0);
                                // Fetch with updated filter
                                const params = new URLSearchParams({ limit: String(LIMIT), offset: '0' });
                                if (action) params.set('action', action);
                                if (tab.value) params.set('entityType', tab.value);
                                if (startDate) params.set('startDate', startDate);
                                if (endDate) params.set('endDate', endDate);
                                setLoading(true);
                                fetch(`/api/admin/logs?${params}`)
                                    .then(r => r.json())
                                    .then(data => {
                                        setLogs(data.logs || []);
                                        setHasMore((data.logs || []).length === LIMIT);
                                        setOffset((data.logs || []).length);
                                    })
                                    .catch(err => setError(err.message))
                                    .finally(() => setLoading(false));
                            }
                        }}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            entityType === tab.value
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters Row */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">操作類型</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                        >
                            {ACTION_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">開始日期</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">結束日期</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                        {loading && !logs.length ? '搜尋中...' : '搜尋'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-700">載入失敗：{error}</p>
                    <button onClick={handleSearch} className="mt-2 text-sm text-red-600 hover:underline">重試</button>
                </div>
            )}

            {/* Initial state */}
            {initialLoad && !loading && !error && (
                <div className="text-center text-gray-500 py-12">
                    <p className="text-lg mb-2">請按「搜尋」查看操作紀錄</p>
                    <p className="text-sm">可先選擇頁籤和篩選條件</p>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && logs.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded" />
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            {!initialLoad && logs.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 whitespace-nowrap">時間</th>
                                    <th className="px-4 py-2 text-left text-gray-600 whitespace-nowrap">操作</th>
                                    <th className="px-4 py-2 text-left text-gray-600 whitespace-nowrap">頁籤</th>
                                    <th className="px-4 py-2 text-left text-gray-600 whitespace-nowrap">操作人</th>
                                    <th className="px-4 py-2 text-left text-gray-600">變更內容</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                                            {formatTime(log.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                            {ENTITY_LABELS[log.entity_type] || log.entity_type}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                            {log.operator || 'Admin'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 text-xs">
                                            <pre className="whitespace-pre-wrap font-sans">{buildDescription(log)}</pre>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!initialLoad && !loading && logs.length === 0 && !error && (
                <div className="text-center text-gray-500 py-12">
                    <p>沒有找到符合條件的紀錄</p>
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="mt-4 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {loading ? '載入中...' : '載入更多'}
                    </button>
                </div>
            )}
        </div>
    );
}
