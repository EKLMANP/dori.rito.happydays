'use client';

import { useEffect, useMemo, useState } from 'react';
import SpacePlannerCanvas, { drawScene } from '@/components/admin/space-planner/SpacePlannerCanvas';
import RoomSetupForm from '@/components/admin/space-planner/RoomSetupForm';
import ValidationPanel from '@/components/admin/space-planner/ValidationPanel';
import { validate } from '@/lib/space-planner/rules';

const DEFAULT_ROOM = { width: 300, height: 400 };

const DEFAULT_ITEMS = [
    { id: 'fence', type: 'fence', x: 30, y: 30, width: 180, height: 240 },
    { id: 'crate', type: 'crate', x: 50, y: 50, width: 60, height: 45 },
    { id: 'pottyTray', type: 'pottyTray', x: 50, y: 200, width: 45, height: 35 },
    { id: 'foodBowl', type: 'foodBowl', x: 60, y: 55, width: 20, height: 20 },
    { id: 'waterBowl', type: 'waterBowl', x: 85, y: 55, width: 20, height: 20 },
];

export default function PuppySpacePlannerPage() {
    const [room, setRoom] = useState(DEFAULT_ROOM);
    const [items, setItems] = useState(DEFAULT_ITEMS);
    const [dogName, setDogName] = useState('');

    // 房間或設備尺寸變動時，自動把超出房間的設備拉回邊界內，避免從畫布消失
    useEffect(() => {
        let changed = false;
        const next = items.map(it => {
            const maxW = Math.min(it.width, room.width);
            const maxH = Math.min(it.height, room.height);
            const x = Math.max(0, Math.min(it.x, room.width - maxW));
            const y = Math.max(0, Math.min(it.y, room.height - maxH));
            if (x !== it.x || y !== it.y || maxW !== it.width || maxH !== it.height) {
                changed = true;
                return { ...it, x, y, width: maxW, height: maxH };
            }
            return it;
        });
        if (changed) setItems(next);
    }, [room, items]);

    const validation = useMemo(() => validate(room, items), [room, items]);

    const reset = () => {
        setRoom(DEFAULT_ROOM);
        setItems(DEFAULT_ITEMS);
    };

    const exportPng = () => {
        if (validation.errors.length > 0) return;
        const fontScale = 2;
        const PAD = Math.round(42 * fontScale);
        const titleH = Math.round(36 * fontScale);
        const bottomH = Math.round(40 * fontScale);
        const targetW = 1200;
        const scale = Math.min((targetW - PAD * 2) / room.width, (900 - PAD * 2 - bottomH - titleH) / room.height);
        const W = room.width * scale + PAD * 2;
        const H = room.height * scale + PAD * 2 + bottomH + titleH;
        const c = document.createElement('canvas');
        c.width = W * 2;
        c.height = H * 2;
        const ctx = c.getContext('2d');
        ctx.scale(2, 2);
        const errorIds = new Set();
        const warnIds = new Set(validation.warnings.map(w => w.id));
        const title = dogName.trim() ? `${dogName.trim()}的居家佈置建議 🐾` : '幼犬居家佈置建議 🐾';
        drawScene(ctx, room, items, scale, errorIds, warnIds, { title, fontScale: 2, showDimensions: true });
        const url = c.toDataURL('image/png');
        const a = document.createElement('a');
        const fileName = dogName.trim()
            ? `puppy-space-${dogName.trim()}.png`
            : `puppy-space-${new Date().toISOString().slice(0, 10)}.png`;
        a.href = url;
        a.download = fileName;
        a.click();
    };

    const canExport = validation.errors.length === 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">幼犬居家空間規劃器</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        拖拉設備到適合位置，依犬研室訓練建議即時驗證
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        ↻ 重設
                    </button>
                    <button
                        onClick={exportPng}
                        disabled={!canExport}
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-orange rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        📥 下載 PNG
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
                <aside className="bg-white border border-gray-200 rounded-xl p-4">
                    <RoomSetupForm room={room} setRoom={setRoom} items={items} setItems={setItems} />
                </aside>

                <section className="bg-white border border-gray-200 rounded-xl p-4 min-w-0">
                    <SpacePlannerCanvas
                        room={room}
                        items={items}
                        setItems={setItems}
                        validation={validation}
                    />
                    <p className="text-xs text-gray-400 mt-3">
                        💡 拖拉設備調整位置；紅框 = 錯誤（需修正才能匯出），黃框 = 訓練建議
                    </p>
                </section>

                <aside className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                    <ValidationPanel validation={validation} />
                    <div>
                        <label className="block">
                            <span className="text-xs text-gray-500">狗狗名字（圖片標題 &amp; 檔名，可空）</span>
                            <input
                                type="text"
                                value={dogName}
                                onChange={(e) => setDogName(e.target.value)}
                                placeholder="例如：小白"
                                className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                {dogName.trim() ? `標題：${dogName.trim()}的居家佈置建議 🐾` : '標題：幼犬居家佈置建議 🐾'}
                            </p>
                        </label>
                    </div>
                </aside>
            </div>
        </div>
    );
}
