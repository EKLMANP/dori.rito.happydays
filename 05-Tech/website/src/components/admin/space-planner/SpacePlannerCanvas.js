'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ITEM_LABELS } from '@/lib/space-planner/rules';
import { computeScale, clampToRoom, pointerToCm } from '@/lib/space-planner/geometry';

const PADDING_PX = 20;
const GRID_CM = 10;

// 畫尺寸標注線（item 外側）
function drawDimLine(ctx, x1, y1, x2, y2, label, fs, color) {
    const tick = 5 * fs;
    const textOff = 10 * fs;
    const sz = Math.round(11 * fs);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = -dy / len, ny = dx / len; // 垂直方向

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1, fs * 0.8);

    // 主線
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 兩端 tick
    [[x1, y1], [x2, y2]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(px - nx * tick, py - ny * tick);
        ctx.lineTo(px + nx * tick, py + ny * tick);
        ctx.stroke();
    });

    // 數字標籤
    const mx = (x1 + x2) / 2 + nx * textOff;
    const my = (y1 + y2) / 2 + ny * textOff;
    ctx.font = `bold ${sz}px "Noto Sans TC", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mx, my);
    ctx.restore();
}

// 繪製畫面到 canvas (用於即時預覽 + PNG 匯出)
export function drawScene(ctx, room, items, scale, errorIds, warnIds, options = {}) {
    const fs = options.fontScale || 1;
    const W = room.width * scale;
    const H = room.height * scale;
    const titleH = options.title ? Math.round(36 * fs) : 0;
    // 額外 padding 供尺寸標注線使用
    const dimPad = options.showDimensions ? Math.round(42 * fs) : PADDING_PX;
    const PAD = Math.max(PADDING_PX, dimPad);
    const fullW = W + PAD * 2;
    const fullH = H + PAD * 2 + Math.round(40 * fs) + titleH;

    ctx.clearRect(0, 0, fullW, fullH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, fullW, fullH);

    ctx.save();
    ctx.translate(PAD, PAD + titleH);

    // 房間框
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, H);

    // 格線 (每 10cm)
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    for (let x = GRID_CM; x < room.width; x += GRID_CM) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, H);
        ctx.stroke();
    }
    for (let y = GRID_CM; y < room.height; y += GRID_CM) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(W, y * scale);
        ctx.stroke();
    }

    // items
    const zoneSz = Math.round(13 * fs);
    const dimSz = Math.round(11 * fs);
    const lineGap = Math.round(9 * fs);

    items.forEach(it => {
        const meta = ITEM_LABELS[it.type];
        const x = it.x * scale;
        const y = it.y * scale;
        const w = it.width * scale;
        const h = it.height * scale;
        const isError = errorIds.has(it.id);
        const isWarn = warnIds.has(it.id);
        const isFence = it.type === 'fence';
        const borderColor = isError ? '#DC2626' : isWarn ? '#D97706' : meta.color;

        if (isFence) {
            ctx.fillStyle = 'rgba(247, 80, 0, 0.06)';
            ctx.fillRect(x, y, w, h);
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
        } else {
            ctx.fillStyle = meta.color + '33';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }

        // 內部標籤 — 依 item 像素尺寸與實際文字長度自動縮放
        const maxChars = Math.max(meta.zone.length, meta.name.length);
        const textH = zoneSz + dimSz + lineGap * 2;
        const fitH = (h * 0.75) / textH;
        const fitW = (w * 0.85) / (maxChars * zoneSz * 1.05); // CJK ≈ 1em/char
        const fit = Math.min(1, fitH, fitW);
        const lzs = Math.max(8, Math.round(zoneSz * fit));
        const lds = Math.max(7, Math.round(dimSz * fit));
        const llg = Math.max(3, Math.round(lineGap * fit));
        ctx.fillStyle = '#1F2937';
        ctx.font = `bold ${lzs}px "Noto Sans TC", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.fillText(meta.zone, cx, cy - llg);
        ctx.font = `${lds}px "Noto Sans TC", system-ui, sans-serif`;
        ctx.fillStyle = '#6B7280';
        ctx.fillText(meta.name, cx, cy + llg);

        // 尺寸標注線（外側）
        if (options.showDimensions) {
            const ann = Math.round(18 * fs);
            // 圍欄固定在下方（寬）和左側（高），避免與內部設備的標注重疊
            if (isFence) {
                const widthY = y + h + ann;
                drawDimLine(ctx, x, widthY, x + w, widthY, `${it.width}`, fs, borderColor);
                const heightX = x - ann;
                drawDimLine(ctx, heightX, y, heightX, y + h, `${it.height}`, fs, borderColor);
            } else {
                // 寬度：item 上方（若靠近頂邊則改為下方）
                const aboveY = y - ann;
                const belowY = y + h + ann;
                const widthY = aboveY >= -PAD + 5 ? aboveY : belowY;
                drawDimLine(ctx, x, widthY, x + w, widthY, `${it.width}`, fs, borderColor);

                // 高度：item 右側（若靠近右邊則改為左側）
                const rightX = x + w + ann;
                const leftX = x - ann;
                const heightX = rightX <= W + PAD - 5 ? rightX : leftX;
                drawDimLine(ctx, heightX, y, heightX, y + h, `${it.height}`, fs, borderColor);
            }
        }
    });

    ctx.restore();

    const uiSz = Math.round(11 * fs);
    const sbY = fullH - Math.round(20 * fs);

    if (!options.hideScaleBar) {
        const scaleBarCm = 50;
        const scaleBarPx = scaleBarCm * scale;
        const sbX = fullW - PAD - scaleBarPx;
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sbX, sbY);
        ctx.lineTo(sbX + scaleBarPx, sbY);
        ctx.moveTo(sbX, sbY - 4);
        ctx.lineTo(sbX, sbY + 4);
        ctx.moveTo(sbX + scaleBarPx, sbY - 4);
        ctx.lineTo(sbX + scaleBarPx, sbY + 4);
        ctx.stroke();
        ctx.fillStyle = '#374151';
        ctx.font = `${uiSz}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${scaleBarCm}`, sbX + scaleBarPx / 2, sbY + 6);
    }

    // 房間尺寸 (左下)
    ctx.fillStyle = '#9CA3AF';
    ctx.font = `${uiSz}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`房間 ${room.width}×${room.height}`, PAD, sbY + 6);

    // 單位標示（右上角）
    ctx.fillStyle = '#6B7280';
    ctx.font = `${uiSz}px system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('單位：cm', fullW - 8, titleH + 6);

    // 圖片標題（只在匯出時顯示）— 字體自動縮小以防超出畫布寬度
    if (options.title) {
        const titleSz = Math.round(22 * (options.fontScale || 1));
        ctx.fillStyle = '#1F2937';
        ctx.font = `bold ${titleSz}px "Noto Sans TC", system-ui, sans-serif`;
        const maxTitleW = fullW - PAD * 2 - 16;
        const measured = ctx.measureText(options.title).width;
        const actualSz = measured > maxTitleW
            ? Math.max(12, Math.floor(titleSz * maxTitleW / measured))
            : titleSz;
        ctx.font = `bold ${actualSz}px "Noto Sans TC", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.title, fullW / 2, titleH / 2 + 4);
    }
}

export default function SpacePlannerCanvas({ room, items, setItems, validation }) {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const [scale, setScale] = useState(1);
    const dragRef = useRef(null);

    const errorIds = new Set(validation.errors.map(e => e.id));
    const warnIds = new Set(validation.warnings.map(w => w.id));

    // 計算 scale 以 fit 容器
    useEffect(() => {
        const update = () => {
            if (!wrapRef.current) return;
            const rect = wrapRef.current.getBoundingClientRect();
            const maxW = rect.width - PADDING_PX * 2;
            const maxH = Math.min(640, window.innerHeight - 280) - PADDING_PX * 2 - 40;
            const s = computeScale(room, { width: maxW, height: maxH });
            setScale(s > 0 ? s : 1);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [room]);

    // 重繪
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const previewOpts = { showDimensions: true };
        const PAD = Math.max(PADDING_PX, Math.round(42 * 1));
        const W = room.width * scale + PAD * 2;
        const H = room.height * scale + PAD * 2 + 40;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, room, items, scale, errorIds, warnIds, previewOpts);
    }, [room, items, scale, validation]);

    const hitTest = useCallback((cm) => {
        // 從上層（後加入）往下測試；fence 最後（讓內部物優先）
        const sorted = [...items].sort((a, b) => (a.type === 'fence' ? 1 : 0) - (b.type === 'fence' ? 1 : 0));
        for (const it of sorted) {
            if (cm.x >= it.x && cm.x <= it.x + it.width && cm.y >= it.y && cm.y <= it.y + it.height) {
                return it;
            }
        }
        return null;
    }, [items]);

    const onPointerDown = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const cm = pointerToCm(e, canvas, scale);
        // 扣除 padding
        cm.x -= Math.max(PADDING_PX, 42) / scale;
        cm.y -= Math.max(PADDING_PX, 42) / scale;
        const hit = hitTest(cm);
        if (!hit) return;
        dragRef.current = {
            id: hit.id,
            offsetX: cm.x - hit.x,
            offsetY: cm.y - hit.y,
        };
        canvas.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!dragRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const cm = pointerToCm(e, canvas, scale);
        cm.x -= Math.max(PADDING_PX, 42) / scale;
        cm.y -= Math.max(PADDING_PX, 42) / scale;
        const { id, offsetX, offsetY } = dragRef.current;
        setItems(prev => prev.map(it => {
            if (it.id !== id) return it;
            return clampToRoom({ ...it, x: cm.x - offsetX, y: cm.y - offsetY }, room);
        }));
    };

    const onPointerUp = (e) => {
        if (dragRef.current) {
            canvasRef.current?.releasePointerCapture?.(e.pointerId);
            dragRef.current = null;
        }
    };

    return (
        <div ref={wrapRef} className="w-full overflow-auto">
            <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="touch-none select-none cursor-move bg-white border border-gray-200 rounded-lg shadow-sm"
            />
        </div>
    );
}
