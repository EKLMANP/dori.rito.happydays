// 計算畫布顯示比例（cm → px）以 fit 容器
export function computeScale(room, maxPx) {
    const sx = maxPx.width / room.width;
    const sy = maxPx.height / room.height;
    return Math.min(sx, sy);
}

// clamp item 位置到房間內
export function clampToRoom(item, room) {
    return {
        ...item,
        x: Math.max(0, Math.min(item.x, room.width - item.width)),
        y: Math.max(0, Math.min(item.y, room.height - item.height)),
    };
}

// 取得 pointer 在 canvas 上的座標 (轉成 cm)
export function pointerToCm(e, canvasEl, scale) {
    const rect = canvasEl.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
    };
}
