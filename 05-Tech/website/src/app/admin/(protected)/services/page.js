'use client';

import { useState, useEffect, useCallback } from 'react';
import { SEED_SERVICES } from '@/lib/seed-data';

export default function AdminServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);
    const [editing, setEditing] = useState(null);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/services');
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            setServices(await res.json());
            setUsingFallback(false);
        } catch {
            setServices(SEED_SERVICES);
            setUsingFallback(true);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    async function saveService(data) {
        const isNew = !data._existing;
        const url = isNew ? '/api/admin/services' : `/api/admin/services/${data.id}`;
        const method = isNew ? 'POST' : 'PUT';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        setEditing(null);
        fetchServices();
    }

    async function deleteService(id) {
        if (!confirm('確定刪除此服務？相關的時段規則和問卷也會一起刪除。')) return;
        await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
        fetchServices();
    }

    async function handleImageUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        return data.url;
    }

    if (loading) return <div className="text-gray-500">載入中...</div>;

    return (
        <div className="space-y-6">
            {usingFallback && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
                    ⚠️ 資料庫未連線，目前顯示預設範本。連線 Neon 後即可編輯儲存。
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">服務管理</h1>
                <button
                    onClick={() => setEditing({ id: '', name: '', description: '', price: 0, duration: 30, is_active: true, sort_order: services.length })}
                    className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    + 新增服務
                </button>
            </div>

            {services.length === 0 && !editing && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    尚未建立任何服務
                </div>
            )}

            <div className="space-y-4">
                {services.map((svc) => (
                    <div key={svc.id} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start justify-between">
                        <div className="flex gap-4">
                            {svc.image_url && (
                                <img src={svc.image_url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-800">{svc.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${svc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {svc.is_active ? '啟用' : '停用'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{svc.description}</p>
                                <div className="text-sm text-gray-600 mt-2">
                                    NT${svc.price} · {svc.duration} 分鐘
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => setEditing({ ...svc, _existing: true })} className="text-sm text-blue-500 hover:text-blue-700">編輯</button>
                            <button onClick={() => deleteService(svc.id)} className="text-sm text-red-500 hover:text-red-700">刪除</button>
                        </div>
                    </div>
                ))}
            </div>

            {editing && (
                <ServiceEditor
                    service={editing}
                    onSave={saveService}
                    onCancel={() => setEditing(null)}
                    onUpload={handleImageUpload}
                />
            )}
        </div>
    );
}

function ServiceEditor({ service, onSave, onCancel, onUpload }) {
    const [form, setForm] = useState({ ...service });
    const [uploading, setUploading] = useState(false);

    async function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const url = await onUpload(file);
        setForm({ ...form, image_url: url });
        setUploading(false);
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {service._existing ? '編輯服務' : '新增服務'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm text-gray-600 block mb-1">服務 ID（英文，建立後不可改）</label>
                    <input
                        type="text"
                        value={form.id}
                        onChange={(e) => setForm({ ...form, id: e.target.value })}
                        disabled={service._existing}
                        placeholder="online-consult"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">服務名稱</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="一對一線上諮詢"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">描述</label>
                <textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="text-sm text-gray-600 block mb-1">價格（NT$）</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">時長（分鐘）</label>
                    <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="15" step="15" />
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">排序</label>
                    <input type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                        <span className="text-sm text-gray-600">啟用</span>
                    </label>
                </div>
            </div>

            <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">封面圖片</label>
                <div className="flex items-center gap-4">
                    {form.image_url && <img src={form.image_url} alt="" className="w-20 h-20 rounded-lg object-cover" />}
                    <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />
                    {uploading && <span className="text-sm text-gray-400">上傳中...</span>}
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => onSave(form)} className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90">儲存</button>
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">取消</button>
            </div>
        </div>
    );
}
