'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const CONVERSION_STATUSES = ['Not started', 'booked call', 'Lost', 'In progress(1-6/8)', '1st session', 'Done'];

const CONVERSION_LABELS = {
    'Not started': '未開始',
    'booked call': '已預約諮詢',
    'Lost': '已流失',
    'In progress(1-6/8)': '進行中',
    '1st session': '第一堂課',
    'Done': '已完成',
};

function StatusBadge({ status }) {
    const styles = {
        'Not started': 'bg-gray-100 text-gray-700',
        'booked call': 'bg-blue-100 text-blue-700',
        'Lost': 'bg-red-100 text-red-700',
        'In progress(1-6/8)': 'bg-yellow-100 text-yellow-700',
        '1st session': 'bg-purple-100 text-purple-700',
        'Done': 'bg-green-100 text-green-700',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
            {CONVERSION_LABELS[status] || status}
        </span>
    );
}

function OrderStatusBadge({ status }) {
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

export default function CustomerDetailPage() {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

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
        fetch('/api/admin/orders')
            .then((r) => {
                if (!r.ok) throw new Error('API error');
                return r.json();
            })
            .then((data) => setOrders(data.orders || []))
            .catch(console.error)
            .finally(() => setOrdersLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError('');
        try {
            // Only send changed fields
            const changed = {};
            for (const key of Object.keys(form)) {
                if (form[key] !== customer[key]) {
                    changed[key] = form[key];
                }
            }
            if (Object.keys(changed).length === 0) {
                setEditing(false);
                return;
            }
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
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
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
                        <button onClick={handleSave} disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                            {saving ? '儲存中...' : '儲存'}
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
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
                    <SelectField label="轉換狀態" name="conversionStatus" value={form.conversionStatus} editing={editing} onChange={handleChange} options={CONVERSION_STATUSES} labels={CONVERSION_LABELS} />
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
