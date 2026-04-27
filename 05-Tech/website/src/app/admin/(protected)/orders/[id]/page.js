'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

function StatusBadge({ status }) {
    const styles = {
        '未開始': 'bg-gray-100 text-gray-500',
        '待排課': 'bg-blue-100 text-blue-700',
        '已排課': 'bg-indigo-100 text-indigo-700',
        '上課中': 'bg-yellow-100 text-yellow-700',
        '完課': 'bg-green-100 text-green-700',
        '已取消': 'bg-red-100 text-red-700',
        '待付款': 'bg-orange-100 text-orange-700',
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
    '未開始': [{ label: '確認排課', next: '待排課' }],
    '待排課': [{ label: '開始排課', next: '已排課' }],
    '已排課': [{ label: '開始上課', next: '上課中' }],
    '上課中': [{ label: '完課', next: '完課' }],
    '完課': [],
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

    // Notes inline edit
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState('');

    // Resend email
    const [resendEmail, setResendEmail] = useState('');
    const [resendNote, setResendNote] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMsg, setResendMsg] = useState(null); // { type: 'success'|'error', text }
    const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining

    // ConfirmDialog state
    const [confirmStatus, setConfirmStatus] = useState(null); // { next, label }
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/admin/orders/${id}`);
            const data = await res.json();
            if (!res.ok) { console.error('API error:', data.error); return; }
            setOrder(data);
            setPaymentStatus(data.paymentStatus || '');
            setTransferDate(data.transferDate || '');
            setBankLast5(data.bankLast5 || '');
            setNotesValue(data.notes || '');
        } catch (err) {
            console.error('Failed to fetch order:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async (useOriginal) => {
        setResendLoading(true);
        setResendMsg(null);
        try {
            const res = await fetch(`/api/admin/orders/${id}/resend-payment-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetEmail: useOriginal ? undefined : (resendEmail || undefined),
                    adminNote: resendNote || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.rateLimitRemaining) setResendCooldown(data.rateLimitRemaining);
                setResendMsg({ type: 'error', text: data.error || '發送失敗' });
            } else {
                setResendMsg({ type: 'success', text: `已成功寄送至 ${data.sentTo}` });
                setResendCooldown(60);
                await fetchOrder();
            }
        } catch (err) {
            setResendMsg({ type: 'error', text: err.message });
        } finally {
            setResendLoading(false);
        }
    };

    // Countdown for rate limit
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

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

    const handleStatusChange = (nextStatus, label) => {
        setConfirmStatus({ next: nextStatus, label });
    };

    const handleStatusConfirm = async (notes) => {
        const fields = { orderStatus: confirmStatus.next };
        if (notes) fields.notes = notes;
        await patchOrder(fields);
        setConfirmStatus(null);
    };

    const handleCancelConfirm = async (notes) => {
        const fields = { paymentStatus: '付款失敗' };
        if (notes) fields.notes = notes;
        await patchOrder(fields);
        setConfirmCancel(false);
    };

    const handleArchiveConfirm = async (notes) => {
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '封存失敗');
            }
            router.push('/admin/orders');
        } catch (err) {
            alert(err.message || '封存失敗');
            setConfirmArchive(false);
        }
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
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-';

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
                        <InfoRow label="客戶姓名">{order.customer?.name || '-'}</InfoRow>
                        <InfoRow label="狗狗名字">{order.customer?.dogName || '-'}</InfoRow>
                        <InfoRow label="手機號碼">{order.customer?.phone || '-'}</InfoRow>
                        <InfoRow label="聯絡 Email">{order.customer?.email || '-'}</InfoRow>
                        <InfoRow label="訓犬師">{order.trainer || '-'}</InfoRow>
                        <InfoRow label="訂購的服務項目">{order.serviceNames?.join(', ') || '-'}</InfoRow>
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
                        <InfoRow label="付款方式">{order.pgPaymentMethod || order.paymentMethod || '-'}</InfoRow>
                        <InfoRow label="付款截止日期">
                            <span className={order.pgPaymentExpireAt && new Date(order.pgPaymentExpireAt) < new Date() ? 'text-red-600 font-semibold' : ''}>
                                {formatDateTime(order.pgPaymentExpireAt || order.paymentExpireAt)}
                            </span>
                        </InfoRow>
                        <InfoRow label="付款日期">{formatDateTime(order.pgPaymentPaidAt || order.paymentPaidAt)}</InfoRow>
                        <InfoRow label="匯款日期">{formatDate(order.transferDate)}</InfoRow>
                        <InfoRow label="帳號後五碼">{order.bankLast5 || '-'}</InfoRow>
                        <InfoRow label="最後寄信時間">{formatDateTime(order.lastEmailSentAt)}</InfoRow>
                        <InfoRow label="付款 Email">{order.customerEmailOverride || order.customer?.email || '-'}</InfoRow>
                    </div>
                </div>

                {/* Notes — inline editable */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">備註</h2>
                        {!editingNotes ? (
                            <button onClick={() => setEditingNotes(true)} className="text-xs text-blue-600 hover:underline">編輯</button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { patchOrder({ notes: notesValue }); setEditingNotes(false); }}
                                    disabled={updating}
                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >儲存</button>
                                <button onClick={() => { setNotesValue(order.notes || ''); setEditingNotes(false); }} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                            </div>
                        )}
                    </div>
                    {editingNotes ? (
                        <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-y"
                            placeholder="輸入備註…"
                        />
                    ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[24px]">{order.notes || <span className="text-gray-400">（無備註）</span>}</p>
                    )}
                </div>

                {/* Resend Payment Email */}
                {order.merchantTradeNo && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">重發付款 Email</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">寄到指定信箱（空白則寄到原始信箱）</label>
                                <input
                                    type="email"
                                    value={resendEmail}
                                    onChange={(e) => setResendEmail(e.target.value)}
                                    placeholder={order.customerEmailOverride || order.customer?.email || '原始客戶信箱'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">客服備註（選填，將出現在 email 內）</label>
                                <textarea
                                    value={resendNote}
                                    onChange={(e) => setResendNote(e.target.value)}
                                    rows={2}
                                    placeholder="例：您原本收到的 email 可能進垃圾郵件，請以此信為準"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-y"
                                />
                            </div>
                            {resendMsg && (
                                <p className={`text-sm ${resendMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                    {resendMsg.type === 'success' ? '✅ ' : '❌ '}{resendMsg.text}
                                </p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => handleResendEmail(true)}
                                    disabled={resendLoading || resendCooldown > 0}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium disabled:opacity-50"
                                >
                                    {resendCooldown > 0 ? `等待 ${resendCooldown}s` : '寄到原信箱'}
                                </button>
                                <button
                                    onClick={() => handleResendEmail(false)}
                                    disabled={resendLoading || resendCooldown > 0 || !resendEmail}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                >
                                    寄到指定信箱
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">每次寄送間隔至少 60 秒，操作記錄至操作紀錄</p>
                        </div>
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
                                            onClick={() => handleStatusChange(next, label)}
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
                        {order.orderStatus === '上課中' && order.remainingSessions > 0 && (
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
                        {/* Cancel button — 寫入 付款狀態=付款失敗，訂單狀態 不動 */}
                        {order.paymentStatus !== '付款失敗' && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">取消訂單</p>
                                <button
                                    onClick={() => setConfirmCancel(true)}
                                    disabled={updating}
                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 text-sm font-medium disabled:opacity-50"
                                >
                                    取消此訂單
                                </button>
                            </div>
                        )}

                        {/* Archive button — 已取消（付款失敗）或未開始的訂單可封存 */}
                        {(order.paymentStatus === '付款失敗' || order.orderStatus === '未開始') && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">封存</p>
                                <button
                                    onClick={() => setConfirmArchive(true)}
                                    disabled={updating}
                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 text-sm font-medium disabled:opacity-50"
                                >
                                    封存訂單
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Status Change Dialog */}
            <ConfirmDialog
                open={!!confirmStatus}
                title="變更訂單狀態"
                variant="default"
                confirmLabel="確認變更"
                onConfirm={handleStatusConfirm}
                onCancel={() => setConfirmStatus(null)}
            >
                {confirmStatus && (
                    <p>確認要將訂單狀態從「{order.orderStatus}」改為「{confirmStatus.next}」嗎？</p>
                )}
            </ConfirmDialog>

            {/* Confirm Cancel Dialog */}
            <ConfirmDialog
                open={confirmCancel}
                title="取消訂單"
                variant="danger"
                confirmLabel="確認取消"
                onConfirm={handleCancelConfirm}
                onCancel={() => setConfirmCancel(false)}
            >
                <p>確定要取消訂單「{order.orderNumber}」嗎？</p>
                <p style={{ color: '#dc2626', marginTop: '8px' }}>付款狀態將被標記為「付款失敗」。</p>
            </ConfirmDialog>

            {/* Confirm Archive Dialog */}
            <ConfirmDialog
                open={confirmArchive}
                title="封存訂單"
                variant="danger"
                confirmLabel="確認封存"
                onConfirm={handleArchiveConfirm}
                onCancel={() => setConfirmArchive(false)}
            >
                <p>確定要封存訂單「{order.orderNumber}」嗎？</p>
                <p style={{ color: '#dc2626', marginTop: '8px' }}>封存後此訂單將被標記為不活躍。</p>
            </ConfirmDialog>
        </div>
    );
}
