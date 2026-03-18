'use client';

import { useState, useEffect, useCallback } from 'react';
import { SEED_FORM_SECTIONS } from '@/lib/seed-data';

const FIELD_TYPES = [
    { value: 'text', label: '單行文字' },
    { value: 'textarea', label: '多行文字' },
    { value: 'email', label: 'Email' },
    { value: 'radio', label: '單選' },
    { value: 'checkbox', label: '多選' },
    { value: 'select', label: '下拉選單' },
];

export default function AdminFormsPage() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [editingSection, setEditingSection] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const fetchForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/forms?service_id=online-consult');
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const data = await res.json();
            setSections(data.length > 0 ? data : SEED_FORM_SECTIONS);
            setUsingFallback(data.length === 0);
        } catch {
            setSections(SEED_FORM_SECTIONS);
            setUsingFallback(true);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchForm(); }, [fetchForm]);

    // --- Section CRUD ---
    async function addSection() {
        await fetch('/api/admin/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: 'online-consult',
                title: '新區塊',
                sort_order: sections.length + 1,
            }),
        });
        fetchForm();
    }

    async function updateSection(section) {
        await fetch('/api/admin/forms', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(section),
        });
        setEditingSection(null);
        fetchForm();
    }

    async function deleteSection(id) {
        if (!confirm('確定刪除此區塊？底下的所有欄位也會一起刪除。')) return;
        await fetch(`/api/admin/forms?id=${id}`, { method: 'DELETE' });
        fetchForm();
    }

    // --- Field CRUD ---
    async function addField(sectionId) {
        await fetch('/api/admin/forms/fields', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section_id: sectionId,
                field_type: 'text',
                label: '新欄位',
                is_required: true,
                sort_order: 99,
            }),
        });
        fetchForm();
    }

    async function updateField(field) {
        await fetch('/api/admin/forms/fields', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(field),
        });
        setEditingField(null);
        fetchForm();
    }

    async function deleteField(id) {
        if (!confirm('確定刪除此欄位？')) return;
        await fetch(`/api/admin/forms/fields?id=${id}`, { method: 'DELETE' });
        fetchForm();
    }

    // --- Reorder ---
    async function moveSectionUp(idx) {
        if (idx === 0) return;
        const items = [...sections];
        [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
        const reorderData = items.map((s, i) => ({ id: s.id, sort_order: i + 1 }));
        await fetch('/api/admin/forms/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'sections', items: reorderData }),
        });
        fetchForm();
    }

    async function moveFieldUp(sectionIdx, fieldIdx) {
        if (fieldIdx === 0) return;
        const section = { ...sections[sectionIdx] };
        const fields = [...section.fields];
        [fields[fieldIdx - 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx - 1]];
        const reorderData = fields.map((f, i) => ({ id: f.id, sort_order: i + 1 }));
        await fetch('/api/admin/forms/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'fields', items: reorderData }),
        });
        fetchForm();
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
                <h1 className="text-2xl font-bold text-gray-800">問卷管理</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                        {showPreview ? '關閉預覽' : '預覽問卷'}
                    </button>
                    <button
                        onClick={addSection}
                        className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90"
                    >
                        + 新增區塊
                    </button>
                </div>
            </div>

            <div className={showPreview ? 'grid grid-cols-2 gap-6' : ''}>
                {/* Editor */}
                <div className="space-y-4">
                    {sections.map((section, sIdx) => (
                        <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => moveSectionUp(sIdx)} disabled={sIdx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                        ↑
                                    </button>
                                    {editingSection === section.id ? (
                                        <SectionInlineEditor
                                            section={section}
                                            onSave={updateSection}
                                            onCancel={() => setEditingSection(null)}
                                        />
                                    ) : (
                                        <div>
                                            <span className="font-semibold text-gray-800">{section.title}</span>
                                            {section.description && (
                                                <span className="text-xs text-gray-400 ml-2">{section.description}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 text-sm">
                                    <button onClick={() => setEditingSection(section.id)} className="text-blue-500 hover:text-blue-700">編輯</button>
                                    <button onClick={() => deleteSection(section.id)} className="text-red-500 hover:text-red-700">刪除</button>
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="p-4 space-y-2">
                                {section.fields.map((field, fIdx) => (
                                    <div key={field.id}>
                                        {editingField === field.id ? (
                                            <FieldEditor field={field} onSave={updateField} onCancel={() => setEditingField(null)} />
                                        ) : (
                                            <div className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => moveFieldUp(sIdx, fIdx)} disabled={fIdx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">↑</button>
                                                    <span className="text-sm text-gray-800">{field.label}</span>
                                                    <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                                                        {FIELD_TYPES.find((t) => t.value === field.field_type)?.label || field.field_type}
                                                    </span>
                                                    {field.is_required && <span className="text-red-400 text-xs">*必填</span>}
                                                </div>
                                                <div className="flex gap-2 text-xs">
                                                    <button onClick={() => setEditingField(field.id)} className="text-blue-500 hover:text-blue-700">編輯</button>
                                                    <button onClick={() => deleteField(field.id)} className="text-red-500 hover:text-red-700">刪除</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addField(section.id)}
                                    className="w-full border border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                                >
                                    + 新增欄位
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Preview */}
                {showPreview && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">問卷預覽</h2>
                        <FormPreview sections={sections} />
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionInlineEditor({ section, onSave, onCancel }) {
    const [title, setTitle] = useState(section.title);
    const [description, setDescription] = useState(section.description || '');

    return (
        <div className="flex items-center gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm font-semibold" autoFocus />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="說明文字" className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-500" />
            <button onClick={() => onSave({ ...section, title, description })} className="text-green-600 text-sm">儲存</button>
            <button onClick={onCancel} className="text-gray-400 text-sm">取消</button>
        </div>
    );
}

function FieldEditor({ field, onSave, onCancel }) {
    const [form, setForm] = useState({ ...field });
    const hasOptions = ['radio', 'checkbox', 'select'].includes(form.field_type);

    function addOption() {
        const options = form.options || [];
        setForm({ ...form, options: [...options, { value: '', label: '' }] });
    }

    function updateOption(idx, key, val) {
        const options = [...(form.options || [])];
        options[idx] = { ...options[idx], [key]: val };
        setForm({ ...form, options });
    }

    function removeOption(idx) {
        setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
    }

    return (
        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30">
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-xs text-gray-500">標題</label>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">類型</label>
                    <select value={form.field_type} onChange={(e) => setForm({ ...form, field_type: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                        {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-xs text-gray-500">說明文字</label>
                    <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Placeholder</label>
                    <input value={form.placeholder || ''} onChange={(e) => setForm({ ...form, placeholder: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
            </div>
            <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} />
                    <span className="text-sm text-gray-600">必填</span>
                </label>
            </div>

            {hasOptions && (
                <div className="mb-3">
                    <label className="text-xs text-gray-500 block mb-1">選項</label>
                    <div className="space-y-1">
                        {(form.options || []).map((opt, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input value={opt.label} onChange={(e) => updateOption(i, 'label', e.target.value)} placeholder="顯示文字" className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" />
                                <input value={opt.value} onChange={(e) => updateOption(i, 'value', e.target.value)} placeholder="值" className="w-24 border border-gray-300 rounded px-2 py-1 text-sm" />
                                <button onClick={() => removeOption(i)} className="text-red-400 text-sm">×</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addOption} className="text-sm text-blue-500 mt-1 hover:text-blue-700">+ 新增選項</button>
                </div>
            )}

            <div className="flex gap-2">
                <button onClick={() => onSave(form)} className="px-3 py-1 bg-brand-orange text-white rounded text-sm hover:opacity-90">儲存</button>
                <button onClick={onCancel} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300">取消</button>
            </div>
        </div>
    );
}

function FormPreview({ sections }) {
    return (
        <div className="space-y-6">
            {sections.map((section) => (
                <div key={section.id}>
                    <h3 className="font-semibold text-gray-800 mb-1">{section.title}</h3>
                    {section.description && <p className="text-sm text-gray-500 mb-3">{section.description}</p>}
                    <div className="space-y-4">
                        {section.fields.map((field) => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.description && <p className="text-xs text-gray-400 mb-1">{field.description}</p>}
                                <PreviewField field={field} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PreviewField({ field }) {
    switch (field.field_type) {
        case 'textarea':
            return <textarea placeholder={field.placeholder} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" rows={3} />;
        case 'radio':
            return (
                <div className="space-y-1">
                    {(field.options || []).map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="radio" disabled name={`preview-${field.id}`} /> {opt.label}
                        </label>
                    ))}
                </div>
            );
        case 'checkbox':
            return (
                <div className="space-y-1">
                    {(field.options || []).map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" disabled /> {opt.label}
                        </label>
                    ))}
                </div>
            );
        case 'select':
            return (
                <select disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50">
                    <option>請選擇</option>
                    {(field.options || []).map((opt) => <option key={opt.value}>{opt.label}</option>)}
                </select>
            );
        case 'email':
            return <input type="email" placeholder={field.placeholder} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />;
        default:
            return <input type="text" placeholder={field.placeholder} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />;
    }
}
