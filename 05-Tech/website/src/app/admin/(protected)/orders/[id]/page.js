'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start py-2">
            <span className="w-32 flex-shrink-0 text-sm text-gray-500">{label}</span>
            <span className="text-sm text-gray-900">{children}</span>
        </div>
    );
}

const STATUS_TRANSITIONS = {
    '報價中': [{ label: '確認訂單', next: '已確認' }],
    '已確認': [
        { label: '開始上課', next: '進行中' },
        { label: '取消', next: '已取消', danger: true },
    ],
    '進行中': [
        { label: '完成', next: '已完成' },
        { label: '取消', next: '已取消', danger: true },
    ],
    '已完成': [],
    '已取消': [],
};

const PAYMENT_STATUSES = ['待付款', '付款中', '已付款', '付款失敗'];

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Payment update form
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [transferDate, setTransferDate] = useState('');
    const [bankLast5, setBankLast5] = useState('');

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/admin/orders/${id}`);
            const data = await res.json();
            if (!res.ok) { console.error('API error:', data.error); return; }
            setOrder(data);
            setPaymentStatus(data.paymentStatus || '');
            setTransferDate(data.transferDate || '');
            setBankLast5(data.bankLast5 || '');
        } catch (err) {
            console.error('Failed to fetch order:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const patchOrder = async (fields) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields),
            });
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            } else {
                const err = await res.json();
                alert(err.error || '更新失敗');
            }
        } catch (err) {
            console.error('Failed to update order:', err);
            alert('更新失敗');
        } finally {
            setUpdating(false);
        }
    };

    const handleStatusChange = (nextStatus) => {
        if (nextStatus === '已取消' && !confirm('確定要取消此訂單嗎？')) return;
        patchOrder({ orderStatus: nextStatus });
    };

    const handleDecrementSession = () => {
        if (order.remainingSessions <= 0) return;
        if (!confirm('確定上完一堂？剩餘堂數將減 1。')) return;
        patchOrder({ remainingSessions: order.remainingSessions - 1 });
    };

    const handlePaymentUpdate = () => {
        patchOrder({ paymentStatus, transferDate, bankLast5 });
        setShowPaymentForm(false);
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
                <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
        );
    }

    if (!order) {
        return <p className="text-center text-gray-500 py-12">找不到此訂單</p>;
    }

    const transitions = STATUS_TRANSITIONS[order.orderStatus] || [];
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-TW') : '-';

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700">
                    &larr;
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">訂單 {order.orderNumber}</h1>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">基本資訊</h2>
                    <div className="divide-y divide-gray-100">
                        <InfoRow label="訂單編號">{order.orderNumber}</InfoRow>
                        <InfoRow label="訓犬師">{order.trainer || '-'}</InfoRow>
                        <InfoRow label="服務項目">{order.serviceIds?.join(', ') || '-'}</InfoRow>
                        <InfoRow label="建立日期">{formatDate(order.createdTime)}</InfoRow>
                    </div>
                </div>

                {/* Financial */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">費用資訊</h2>
                    <div className="divide-y divide-gray-100">
                        <InfoRow label="購買課堂數">{order.sessions} 堂</InfoRow>
                        <InfoRow label="單堂課報價">${order.unitPrice?.toLocaleString()}</InfoRow>
                        <InfoRow label="總金額">
                            <span className="font-semibold">${order.totalAmount?.toLocaleString()}</span>
                        </InfoRow>
                        <InfoRow label="剩餘課堂數">
                            <span className={order.remainingSessions <= 1 ? 'text-red-600 font-semibold' : ''}>
                                {order.remainingSessions} 堂
                            </span>
                        </InfoRow>
                    </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">狀態</h2>
                    <div className="divide-y divide-gray-100">
                        <InfoRow label="訂單狀態"><StatusBadge status={order.orderStatus} /></InfoRow>
                        <InfoRow label="付款狀態"><StatusBadge status={order.paymentStatus} /></InfoRow>
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">日期</h2>
                    <div className="divide-y divide-gray-100">
                        <InfoRow label="開始日期">{formatDate(order.startDate)}</InfoRow>
                        <InfoRow label="結束日期">{formatDate(order.endDate)}</InfoRow>
                    </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">付款資訊</h2>
                    <div className="divide-y divide-gray-100">
                        <InfoRow label="匯款日期">{formatDate(order.transferDate)}</InfoRow>
                        <InfoRow label="帳號後五碼">{order.bankLast5 || '-'}</InfoRow>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">備註</h2>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>

                    <div className="space-y-4">
                        {/* Status transitions */}
                        {transitions.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">變更訂單狀態</p>
                                <div className="flex flex-wrap gap-2">
                                    {transitions.map(({ label, next, danger }) => (
                                        <button
                                            key={next}
                                            onClick={() => handleStatusChange(next)}
                                            disabled={updating}
                                            className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${
                                                danger
                                                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Decrement session */}
                        {order.orderStatus === '進行中' && order.remainingSessions > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">課堂紀錄</p>
                                <button
                                    onClick={handleDecrementSession}
                                    disabled={updating}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium disabled:opacity-50"
                                >
                                    上完一堂 (剩餘 {order.remainingSessions} → {order.remainingSessions - 1})
                                </button>
                            </div>
                        )}

                        {/* Payment update */}
                        <div>
                            <p className="text-sm text-gray-500 mb-2">付款管理</p>
                            {!showPaymentForm ? (
                                <button
                                    onClick={() => setShowPaymentForm(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                                >
                                    更新付款資訊
                                </button>
                            ) : (
                                <div className="border border-gray-200 rounded-md p-4 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">付款狀態</label>
                                        <select
                                            value={paymentStatus}
                                            onChange={(e) => setPaymentStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                        >
                                            {PAYMENT_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">匯款日期</label>
                                        <input
                                            type="date"
                                            value={transferDate}
                                            onChange={(e) => setTransferDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">帳號後五碼</label>
                                        <input
                                            type="text"
                                            maxLength={5}
                                            value={bankLast5}
                                            onChange={(e) => setBankLast5(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePaymentUpdate}
                                            disabled={updating}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                        >
                                            儲存
                                        </button>
                                        <button
                                            onClick={() => setShowPaymentForm(false)}
                                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
