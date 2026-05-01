'use client';

import { useState, useEffect } from 'react';
import { ITEM_LABELS } from '@/lib/space-planner/rules';

function NumberInput({ label, value, onChange, min = 1, max = 2000 }) {
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const commit = () => {
        const n = Number(draft);
        if (!Number.isFinite(n) || draft === '') {
            setDraft(String(value));
            return;
        }
        const clamped = Math.max(min, Math.min(max, n));
        if (clamped !== value) onChange(clamped);
        setDraft(String(clamped));
    };

    return (
        <label className="block">
            <span className="text-xs text-gray-500">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                value={draft}
                min={min}
                max={max}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
        </label>
    );
}

export default function RoomSetupForm({ room, setRoom, items, setItems }) {
    const update = (id, patch) => setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📐 房間尺寸 (cm)</h3>
                <div className="grid grid-cols-2 gap-2">
                    <NumberInput label="寬" value={room.width} onChange={(v) => setRoom({ ...room, width: v })} />
                    <NumberInput label="長" value={room.height} onChange={(v) => setRoom({ ...room, height: v })} />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🔧 設備尺寸 (cm)</h3>
                <div className="space-y-3">
                    {items.map(it => (
                        <div key={it.id} className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className="inline-block w-3 h-3 rounded"
                                    style={{ backgroundColor: ITEM_LABELS[it.type].color }}
                                />
                                <span className="text-xs font-semibold text-gray-700">
                                    {ITEM_LABELS[it.type].name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {ITEM_LABELS[it.type].zone}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <NumberInput label="寬" value={it.width} onChange={(v) => update(it.id, { width: v })} />
                                <NumberInput label="長" value={it.height} onChange={(v) => update(it.id, { height: v })} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
