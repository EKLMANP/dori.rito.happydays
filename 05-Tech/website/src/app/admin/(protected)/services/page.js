'use client';

import { useState, useEffect, useCallback } from 'react';

const SERVICE_TYPES = ['Offline', 'Online', 'Product', 'Service'];
const STATUS_OPTIONS = ['Live', 'In prep', 'Not started'];

const TYPE_COLORS = {
    'Offline': 'bg-blue-100 text-blue-700',
    'Online': 'bg-purple-100 text-purple-700',
    'Product': 'bg-orange-100 text-orange-700',
    'Service': 'bg-green-100 text-green-700',
};

const STATUS_COLORS = {
    'Live': 'bg-green-100 text-green-700',
    'In prep': 'bg-yellow-100 text-yellow-700',
    'Not started': 'bg-gray-100 text-gray-700',
};

// Display labels for Chinese UI
const TYPE_LABELS = {
    'Offline': '線下課程',
    'Online': '線上課程',
    'Product': '商品',
    'Service': '服務',
};

const STATUS_LABELS = {
    'Live': '上架中',
    'In prep': '準備中',
    'Not started': '未開始',
};

const EMPTY_FORM = {
    name: '',
    code: '',
    type: 'Offline',
    defaultSessions: '',
    suggestedPrice: '',
    status: 'Live',
    description: '',
};

function formatTWD(value) {
    if (value == null || value === '') return '-';
    return `TWD ${Number(value).toLocaleString()}`;
}

export default function AdminServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchServices = useCallback(() => {
        setLoading(true);
        fetch('/api/admin/services')
            .then((r) => {
                if (!r.ok) throw new Error('API error');
                return r.json();
            })
            .then((data) => setServices(data.services || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // --- Create ---
    const handleCreate = async () => {
        if (!createForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...createForm,
                    defaultSessions: createForm.defaultSessions ? Number(createForm.defaultSessions) : null,
                    suggestedPrice: createForm.suggestedPrice ? Number(createForm.suggestedPrice) : null,
                }),
            });
            if (!res.ok) throw new Error('建立失敗');
            setShowCreate(false);
            setCreateForm(EMPTY_FORM);
            fetchServices();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // --- Edit ---
    const startEdit = (service) => {
        setEditingId(service.id);
        setEditForm({
            name: service.name || '',
            code: service.code || '',
            type: service.type || 'Offline',
            defaultSessions: service.defaultSessions ?? '',
            suggestedPrice: service.suggestedPrice ?? '',
            status: service.status || 'Live',
            description: service.description || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (id) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/services/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    defaultSessions: editForm.defaultSessions !== '' ? Number(editForm.defaultSessions) : null,
                    suggestedPrice: editForm.suggestedPrice !== '' ? Number(editForm.suggestedPrice) : null,
                }),
            });
            if (!res.ok) throw new Error('儲存失敗');
            setEditingId(null);
            fetchServices();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageSkeleton />;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">服務管理</h1>
                <button
                    onClick={() => setShowCreate((v) => !v)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                    {showCreate ? '取消新增' : '+ 新增服務'}
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="bg-white rounded-lg border border-blue-200 p-5 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">新增服務</h2>
                    <ServiceForm
                        form={createForm}
                        onChange={setCreateForm}
                    />
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !createForm.name.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {saving ? '儲存中...' : '建立服務'}
                        </button>
                        <button
                            onClick={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); }}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}

            {/* Service cards */}
            {services.length === 0 ? (
                <p className="text-center text-gray-500 py-12">目前沒有任何服務</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) =>
                        editingId === service.id ? (
                            <div key={service.id} className="bg-white rounded-lg border-2 border-blue-300 p-5">
                                <h3 className="text-sm font-medium text-blue-600 mb-3">編輯服務</h3>
                                <ServiceForm
                                    form={editForm}
                                    onChange={setEditForm}
                                />
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleSave(service.id)}
                                        disabled={saving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                    >
                                        {saving ? '儲存中...' : '儲存'}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <ServiceCard key={service.id} service={service} onEdit={() => startEdit(service)} />
                        )
                    )}
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function ServiceCard({ service, onEdit }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    {service.code && (
                        <p className="text-sm text-gray-400 mt-0.5">{service.code}</p>
                    )}
                </div>
                <button
                    onClick={onEdit}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                >
                    編輯
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[service.type] || 'bg-gray-100 text-gray-700'}`}>
                    {TYPE_LABELS[service.type] || service.type || '-'}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[service.status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[service.status] || service.status || '-'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                <div>
                    <span className="text-gray-500">預設堂數</span>
                    <span className="ml-2 text-gray-900 font-medium">{service.defaultSessions ?? '-'}</span>
                </div>
                <div>
                    <span className="text-gray-500">建議單價</span>
                    <span className="ml-2 text-gray-900 font-medium">{formatTWD(service.suggestedPrice)}</span>
                </div>
            </div>

            {service.orderCount != null && (
                <p className="text-sm text-gray-500">
                    訂單數量 <span className="text-gray-900 font-medium">{service.orderCount}</span>
                </p>
            )}

            {service.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{service.description}</p>
            )}
        </div>
    );
}

function ServiceForm({ form, onChange }) {
    const update = (field, value) => onChange({ ...form, [field]: value });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
                <span className="text-sm text-gray-600">服務名稱 <span className="text-red-500">*</span></span>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="例：基礎服從訓練"
                />
            </label>
            <label className="block">
                <span className="text-sm text-gray-600">服務代碼</span>
                <input
                    type="text"
                    value={form.code}
                    onChange={(e) => update('code', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="例：BASIC-OBD"
                />
            </label>
            <label className="block">
                <span className="text-sm text-gray-600">服務類型</span>
                <select
                    value={form.type}
                    onChange={(e) => update('type', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                    {SERVICE_TYPES.map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                    ))}
                </select>
            </label>
            <label className="block">
                <span className="text-sm text-gray-600">預設堂數</span>
                <input
                    type="number"
                    min="0"
                    value={form.defaultSessions}
                    onChange={(e) => update('defaultSessions', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="例：10"
                />
            </label>
            <label className="block">
                <span className="text-sm text-gray-600">建議單價 (TWD)</span>
                <input
                    type="number"
                    min="0"
                    value={form.suggestedPrice}
                    onChange={(e) => update('suggestedPrice', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="例：2000"
                />
            </label>
            <label className="block">
                <span className="text-sm text-gray-600">服務狀態</span>
                <select
                    value={form.status}
                    onChange={(e) => update('status', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                    ))}
                </select>
            </label>
            <label className="block sm:col-span-2">
                <span className="text-sm text-gray-600">服務說明</span>
                <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="簡述服務內容..."
                />
            </label>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-36 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded-lg" />
                ))}
            </div>
        </div>
    );
}
