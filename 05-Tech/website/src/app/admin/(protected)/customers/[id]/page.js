'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
    CONVERSION_STATUSES,
    CONVERSION_BADGE_STYLES,
    ORDER_STATUS_BADGE_STYLES,
} from '@/lib/order-status';

function StatusBadge({ status }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CONVERSION_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
            {status || '未開始'}
        </span>
    );
}

function OrderStatusBadge({ status }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

export default function CustomerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [confirmSave, setConfirmSave] = useState(false);
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [changedFields, setChangedFields] = useState({});

    useEffect(() => {
        fetch(`/api/admin/customers/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('API error');
                return r.json();
            })
            .then((data) => {
                setCustomer(data);
                setForm(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        fetch(`/api/admin/orders?customerId=${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('API error');
                return r.json();
            })
            .then((data) => setOrders(data.orders || []))
            .catch(console.error)
            .finally(() => setOrdersLoading(false));
    }, [id]);

    const handleResetConversion = async () => {
        try {
            const res = await fetch(`/api/admin/customers/${id}/reset-conversion`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '重設失敗');
            setCustomer(data);
            setForm(data);
        } catch (err) {
            setSaveError(err.message);
        }
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const getChangedFields = () => {
        const changed = {};
        for (const key of Object.keys(form)) {
            if (form[key] !== customer[key]) {
                changed[key] = { old: customer[key], new: form[key] };
            }
        }
        return changed;
    };

    const handleSaveClick = () => {
        const changed = getChangedFields();
        if (Object.keys(changed).length === 0) {
            setEditing(false);
            return;
        }
        setChangedFields(changed);
        setConfirmSave(true);
    };

    const handleSaveConfirm = async (notes) => {
        setSaving(true);
        setSaveError('');
        try {
            const changed = {};
            for (const key of Object.keys(form)) {
                if (form[key] !== customer[key]) {
                    changed[key] = form[key];
                }
            }
            if (notes) changed.notes = notes;
            const res = await fetch(`/api/admin/customers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(changed),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '更新失敗');
            setCustomer(data);
            setForm(data);
            setEditing(false);
            setConfirmSave(false);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleArchiveConfirm = async (notes) => {
        try {
            const res = await fetch(`/api/admin/customers/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '封存失敗');
            }
            router.push('/admin/customers');
        } catch (err) {
            setSaveError(err.message);
            setConfirmArchive(false);
        }
    };

    const handleCancel = () => {
        setForm(customer);
        setEditing(false);
        setSaveError('');
    };

    if (loading) return <PageSkeleton />;
    if (!customer) return <p className="text-center text-gray-500 py-12">找不到此客戶</p>;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/customers" className="text-gray-500 hover:text-gray-700 text-sm">&larr; 返回客戶列表</Link>
                    <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                    <StatusBadge status={customer.conversionStatus} />
                </div>
                {!editing ? (
                    <button onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 font-medium">
                        編輯
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={handleCancel}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                            取消
                        </button>
                        <button onClick={handleSaveClick} disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                            {saving ? '儲存中...' : '儲存'}
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">訂單數</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{customer.orderCount ?? 0}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600">總消費金額</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                        ${(customer.totalSpent ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">課堂進度</p>
                    {customer.conversionStatus === '進行中' && customer.purchasedSessions ? (
                        <p className="text-2xl font-bold text-yellow-800 mt-1">
                            {customer.usedSessions ?? 0}/{customer.purchasedSessions}
                            <span className="text-sm font-normal text-yellow-700 ml-2">剩 {customer.remainingSessions ?? 0}</span>
                        </p>
                    ) : (
                        <p className="text-2xl font-bold text-gray-400 mt-1">-</p>
                    )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">First Call</p>
                    <p className="text-2xl font-bold text-gray-700 mt-1">
                        {customer.firstCall || '-'}
                    </p>
                </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">客戶資料</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="客戶姓名" name="name" value={form.name} editing={editing} onChange={handleChange} />
                    <Field label="狗狗名字" name="dogName" value={form.dogName} editing={editing} onChange={handleChange} />
                    <Field label="聯絡手機" name="phone" value={form.phone} editing={editing} onChange={handleChange} />
                    <Field label="Email" name="email" value={form.email} editing={editing} onChange={handleChange} />
                    <Field label="地址" name="address" value={form.address} editing={editing} onChange={handleChange} />
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-500">轉換狀態</label>
                            {customer.manualConversionOverride && (
                                <button
                                    type="button"
                                    onClick={handleResetConversion}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                    title={`目前為手動覆寫，自動推導值：${customer.derivedStatus || '未開始'}`}
                                >
                                    ↻ 重設為自動（{customer.derivedStatus || '未開始'}）
                                </button>
                            )}
                        </div>
                        {editing ? (
                            <select name="conversionStatus" value={form.conversionStatus || ''} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">未設定</option>
                                {CONVERSION_STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : (
                            <p className="text-sm text-gray-900">
                                {customer.conversionStatus || '-'}
                                {!customer.manualConversionOverride && customer.derivedStatus && (
                                    <span className="ml-2 text-xs text-gray-400">（自動）</span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1">備註</label>
                        {editing ? (
                            <textarea name="notes" value={form.notes || ''} onChange={handleChange} rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        ) : (
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{customer.notes || '-'}</p>
                        )}
                    </div>
                </div>
                {saveError && <p className="px-4 pb-4 text-sm text-red-600">{saveError}</p>}
            </div>

            {/* Archive Button */}
            <div className="mb-6">
                <button
                    onClick={() => setConfirmArchive(true)}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 text-sm font-medium"
                >
                    封存客戶
                </button>
            </div>

            {/* Related Orders */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">相關訂單</h2>
                    <Link href={`/admin/orders/new?customerId=${id}`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                        + 新增訂單
                    </Link>
                </div>
                {ordersLoading ? (
                    <div className="p-4 animate-pulse">
                        <div className="h-20 bg-gray-200 rounded" />
                    </div>
                ) : orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600">訂單編號</th>
                                    <th className="px-4 py-2 text-left text-gray-600">服務項目</th>
                                    <th className="px-4 py-2 text-left text-gray-600">訓犬師</th>
                                    <th className="px-4 py-2 text-left text-gray-600">總金額</th>
                                    <th className="px-4 py-2 text-left text-gray-600">訂單狀態</th>
                                    <th className="px-4 py-2 text-left text-gray-600">付款狀態</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/orders/${o.id}`} className="text-blue-600 hover:underline">
                                                {o.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{o.serviceName || '-'}</td>
                                        <td className="px-4 py-3 text-gray-700">{o.trainer || '-'}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {o.totalAmount != null ? `$${o.totalAmount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-3"><OrderStatusBadge status={o.orderStatus} /></td>
                                        <td className="px-4 py-3"><OrderStatusBadge status={o.paymentStatus} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="px-4 py-8 text-center text-gray-500">尚無相關訂單</p>
                )}
            </div>
            {/* Confirm Save Dialog */}
            <ConfirmDialog
                open={confirmSave}
                title="修改客戶資料"
                variant="default"
                confirmLabel="確認修改"
                onConfirm={handleSaveConfirm}
                onCancel={() => setConfirmSave(false)}
            >
                <p style={{ marginBottom: '8px' }}>以下欄位將被修改：</p>
                {Object.entries(changedFields).map(([key, { old: oldVal, new: newVal }]) => (
                    <div key={key} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        <strong>{key}</strong>：{oldVal || '(空)'} → {newVal || '(空)'}
                    </div>
                ))}
            </ConfirmDialog>

            {/* Confirm Archive Dialog */}
            <ConfirmDialog
                open={confirmArchive}
                title="封存客戶"
                variant="danger"
                confirmLabel="確認封存"
                onConfirm={handleArchiveConfirm}
                onCancel={() => setConfirmArchive(false)}
            >
                <p>確定要封存客戶「{customer.name}」嗎？</p>
                <p style={{ color: '#dc2626', marginTop: '8px' }}>封存後此客戶資料將被標記為不活躍，相關訂單不受影響。</p>
            </ConfirmDialog>
        </div>
    );
}

function Field({ label, name, value, editing, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            {editing ? (
                <input name={name} value={value || ''} onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            ) : (
                <p className="text-sm text-gray-900">{value || '-'}</p>
            )}
        </div>
    );
}

function SelectField({ label, name, value, editing, onChange, options, labels }) {
    const displayValue = labels ? (labels[value] || value) : value;
    return (
        <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            {editing ? (
                <select name={name} value={value || ''} onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">未設定</option>
                    {options.map((o) => <option key={o} value={o}>{labels ? (labels[o] || o) : o}</option>)}
                </select>
            ) : (
                <p className="text-sm text-gray-900">{displayValue || '-'}</p>
            )}
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg mb-6" />
            <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
    );
}
