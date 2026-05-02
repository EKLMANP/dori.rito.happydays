'use client';

import { useState } from 'react';

let idCounter = 1000;
const newId = () => `id-${++idCounter}-${Date.now()}`;

export default function ScheduleEditor({
    meta, setMeta,
    categories, setCategories,
    rows, setRows,
    footer, setFooter,
}) {
    const [draggingId, setDraggingId] = useState(null);
    const [showCatModal, setShowCatModal] = useState(false);
    const [newCat, setNewCat] = useState({ name: '', color: '#8b5cf6' });

    const updateRow = (id, patch) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };
    const addRow = () => {
        setRows((prev) => [
            ...prev,
            { id: newId(), time: '', categoryId: categories[0]?.id || '', title: '新時段', description: '' },
        ]);
    };
    const deleteRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
    const moveRow = (id, dir) => {
        setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === id);
            const target = idx + dir;
            if (idx < 0 || target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[target]] = [next[target], next[idx]];
            return next;
        });
    };
    const onDragStart = (id) => setDraggingId(id);
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (targetId) => {
        if (!draggingId || draggingId === targetId) return;
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === draggingId);
            const to = prev.findIndex((r) => r.id === targetId);
            if (from < 0 || to < 0) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setDraggingId(null);
    };

    const addCategory = () => {
        if (!newCat.name.trim()) return;
        setCategories((prev) => [...prev, { id: newId(), name: newCat.name.trim(), color: newCat.color }]);
        setNewCat({ name: '', color: '#8b5cf6' });
        setShowCatModal(false);
    };
    const deleteCategory = (id) => {
        if (categories.length <= 1) return;
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setRows((prev) => prev.map((r) => (r.categoryId === id ? { ...r, categoryId: categories.find((c) => c.id !== id)?.id || '' } : r)));
    };

    return (
        <div className="space-y-5">
            {/* Meta */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">基本資訊</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="狗狗姓名" value={meta.dogName} onChange={(v) => setMeta({ ...meta, dogName: v })} />
                    <Field label="品種" value={meta.breed} onChange={(v) => setMeta({ ...meta, breed: v })} />
                    <Field label="月齡" value={meta.ageMonths} onChange={(v) => setMeta({ ...meta, ageMonths: v })} />
                    <Field label="睡眠目標" value={meta.sleepGoal} onChange={(v) => setMeta({ ...meta, sleepGoal: v })} />
                </div>
            </section>

            {/* Categories */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">類別</h3>
                    <button
                        onClick={() => setShowCatModal(true)}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                    >
                        + 新增類別
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <div key={cat.id} className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-2 pr-1 py-1">
                            <input
                                type="color"
                                value={cat.color}
                                onChange={(e) =>
                                    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, color: e.target.value } : c)))
                                }
                                className="w-5 h-5 border-0 bg-transparent cursor-pointer"
                                aria-label="顏色"
                            />
                            <input
                                value={cat.name}
                                onChange={(e) =>
                                    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, name: e.target.value } : c)))
                                }
                                className="text-xs bg-transparent outline-none w-20"
                            />
                            <button
                                onClick={() => deleteCategory(cat.id)}
                                className="w-5 h-5 text-gray-400 hover:text-red-500 text-xs"
                                disabled={categories.length <= 1}
                                title="刪除"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Rows */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">時段（{rows.length}）</h3>
                    <button
                        onClick={addRow}
                        className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                        + 新增時段
                    </button>
                </div>
                <div className="space-y-2">
                    {rows.map((row, idx) => (
                        <div
                            key={row.id}
                            draggable
                            onDragStart={() => onDragStart(row.id)}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop(row.id)}
                            className={`border rounded-lg p-3 bg-gray-50 ${draggingId === row.id ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start gap-2">
                                <div className="flex flex-col gap-1 pt-1">
                                    <button
                                        onClick={() => moveRow(row.id, -1)}
                                        disabled={idx === 0}
                                        className="w-6 h-6 text-xs text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30"
                                        title="上移"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveRow(row.id, 1)}
                                        disabled={idx === rows.length - 1}
                                        className="w-6 h-6 text-xs text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30"
                                        title="下移"
                                    >
                                        ↓
                                    </button>
                                </div>
                                <div className="flex-1 grid grid-cols-12 gap-2">
                                    <input
                                        value={row.time}
                                        onChange={(e) => updateRow(row.id, { time: e.target.value })}
                                        placeholder="時間"
                                        className="col-span-3 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                                    />
                                    <select
                                        value={row.categoryId}
                                        onChange={(e) => updateRow(row.id, { categoryId: e.target.value })}
                                        className="col-span-3 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        value={row.title}
                                        onChange={(e) => updateRow(row.id, { title: e.target.value })}
                                        placeholder="主標題"
                                        className="col-span-6 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                                    />
                                    <textarea
                                        value={row.description}
                                        onChange={(e) => updateRow(row.id, { description: e.target.value })}
                                        placeholder="說明（選填）"
                                        rows={2}
                                        className="col-span-12 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white resize-none"
                                    />
                                </div>
                                <button
                                    onClick={() => deleteRow(row.id)}
                                    className="text-gray-400 hover:text-red-500 text-sm pt-1"
                                    title="刪除"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer notes */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">底部說明</h3>
                <div className="space-y-3">
                    <TextArea label="門的開關規則" value={footer.doorRule} onChange={(v) => setFooter({ ...footer, doorRule: v })} />
                    <Field label="餵食間隔" value={footer.feedingInterval} onChange={(v) => setFooter({ ...footer, feedingInterval: v })} />
                    <Field label="核心原則" value={footer.principle} onChange={(v) => setFooter({ ...footer, principle: v })} />
                    <Field label="放風結束訊號" value={footer.releaseSignal} onChange={(v) => setFooter({ ...footer, releaseSignal: v })} />
                    <Field label="他叫的時候" value={footer.ignoreNote} onChange={(v) => setFooter({ ...footer, ignoreNote: v })} />
                </div>
            </section>

            {/* Add category modal */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
                    <div className="bg-white rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-semibold text-gray-800 mb-4">新增類別</h3>
                        <div className="space-y-3">
                            <input
                                value={newCat.name}
                                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                                placeholder="類別名稱"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">顏色：</span>
                                <input
                                    type="color"
                                    value={newCat.color}
                                    onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                                    className="w-10 h-10 border-0 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setShowCatModal(false)}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={addCategory}
                                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                            >
                                新增
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange }) {
    return (
        <label className="block">
            <span className="text-xs text-gray-500">{label}</span>
            <input
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
            />
        </label>
    );
}

function TextArea({ label, value, onChange }) {
    return (
        <label className="block">
            <span className="text-xs text-gray-500">{label}</span>
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={2}
                className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-200 rounded resize-none"
            />
        </label>
    );
}
