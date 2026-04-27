'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ORDER_STATUSES, ORDER_STATUS_BADGE_STYLES } from '@/lib/order-status';

const PAYMENT_STATUSES = ['待付款', '付款中', '已付款', '付款失敗'];
const TRAINERS = ['Eric', 'Pennee'];
const PAGE_SIZE = 20;

function StatusBadge({ status }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

export default function OrderListPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);

    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [trainerFilter, setTrainerFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Fetch service options for filter dropdown
    const [serviceOptions, setServiceOptions] = useState([]);
    useEffect(() => {
        fetch('/api/admin/services')
            .then(res => res.json())
            .then(data => setServiceOptions(data.services || []))
            .catch(err => console.error('Failed to load services:', err));
    }, []);

    const fetchOrders = useCallback(async (cursor = null, append = false) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (searchQuery) {
                params.set('search', searchQuery);
            } else {
                if (statusFilter) params.set('status', statusFilter);
                if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
                if (trainerFilter) params.set('trainer', trainerFilter);
                if (serviceFilter) params.set('service', serviceFilter);
                if (cursor) params.set('cursor', cursor);
                params.set('pageSize', PAGE_SIZE);
            }

            const res = await fetch(`/api/admin/orders?${params}`);
            const data = await res.json();
            if (!res.ok) { console.error('API error:', data.error); return; }

            if (append) {
                setOrders((prev) => [...prev, ...(data.orders || [])]);
            } else {
                setOrders(data.orders || []);
            }
            setHasMore(data.hasMore || false);
            setNextCursor(data.nextCursor || null);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [statusFilter, paymentStatusFilter, trainerFilter, serviceFilter, searchQuery]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleLoadMore = () => {
        if (nextCursor && hasMore) {
            fetchOrders(nextCursor, true);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
                <Link
                    href="/admin/orders/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                    + 新增訂單
                </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
                <form
                    onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchInput); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="搜尋客戶姓名、訂單編號、手機、Email、狗狗名字..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                        搜尋
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md"
                        >
                            清除
                        </button>
                    )}
                </form>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                    <option value="">所有訂單狀態</option>
                    {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                    <option value="">所有付款狀態</option>
                    {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    value={trainerFilter}
                    onChange={(e) => setTrainerFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                    <option value="">所有訓犬師</option>
                    {TRAINERS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                    <option value="">所有服務項目</option>
                    {serviceOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200">
                {loading ? (
                    <div className="animate-pulse p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <p className="px-4 py-8 text-center text-gray-500">沒有符合條件的訂單</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-gray-600">訂單編號</th>
                                        <th className="px-4 py-2 text-left text-gray-600">訂購的服務項目</th>
                                        <th className="px-4 py-2 text-left text-gray-600">客戶姓名</th>
                                        <th className="px-4 py-2 text-left text-gray-600">狗狗名字</th>
                                        <th className="px-4 py-2 text-left text-gray-600">聯絡手機</th>
                                        <th className="px-4 py-2 text-left text-gray-600">聯絡 Email</th>
                                        <th className="px-4 py-2 text-left text-gray-600">訓犬師</th>
                                        <th className="px-4 py-2 text-right text-gray-600">總金額</th>
                                        <th className="px-4 py-2 text-center text-gray-600">剩餘堂數</th>
                                        <th className="px-4 py-2 text-center text-gray-600">訂單狀態</th>
                                        <th className="px-4 py-2 text-center text-gray-600">付款狀態</th>
                                        <th className="px-4 py-2 text-left text-gray-600">建立日期</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={order.serviceName}>
                                                {order.serviceName || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{order.customerName || '-'}</td>
                                            <td className="px-4 py-3 text-gray-700">{order.dogName || '-'}</td>
                                            <td className="px-4 py-3 text-gray-700">{order.phone || '-'}</td>
                                            <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate" title={order.email}>
                                                {order.email || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{order.trainer || '-'}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                ${order.totalAmount?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-700">
                                                {order.remainingSessions}/{order.sessions}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={order.orderStatus} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={order.paymentStatus} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {order.createdTime ? new Date(order.createdTime).toLocaleDateString('zh-TW') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {hasMore && (
                            <div className="px-4 py-3 border-t border-gray-200 text-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                                >
                                    {loadingMore ? '載入中...' : '載入更多'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
