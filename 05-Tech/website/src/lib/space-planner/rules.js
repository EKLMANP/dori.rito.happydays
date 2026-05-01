// 犬研室訓練規則 — 集中管理，可隨時調整
// 單位：cm

export const TRAINING_RULES = {
    pottyToCrateMinDistance: 30,
    foodBowlToPottyMinDistance: 50,
    activityAreaCrateMultiplier: 2,
};

export const ITEM_LABELS = {
    fence: { name: '圍欄', zone: '活動區', color: '#F75000' },
    crate: { name: '籠子', zone: '休息區', color: '#3B82F6' },
    pottyTray: { name: '尿盆', zone: '廁所', color: '#10B981' },
    foodBowl: { name: '飯碗', zone: '吃飯', color: '#F59E0B' },
    waterBowl: { name: '水碗', zone: '喝水', color: '#60A5FA' },
};

function rectsOverlap(a, b) {
    return !(a.x + a.width <= b.x || b.x + b.width <= a.x ||
             a.y + a.height <= b.y || b.y + b.height <= a.y);
}

function rectInside(inner, outer) {
    return inner.x >= outer.x && inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height;
}

function rectDistance(a, b) {
    const dx = Math.max(0, Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width)));
    const dy = Math.max(0, Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height)));
    return Math.sqrt(dx * dx + dy * dy);
}

// 回傳: { errors: [], warnings: [] }
// items 包含 {id, type, x, y, width, height} 為 cm
export function validate(room, items) {
    const errors = [];
    const warnings = [];
    const fence = items.find(i => i.type === 'fence');
    const crate = items.find(i => i.type === 'crate');
    const potty = items.find(i => i.type === 'pottyTray');
    const bowl = items.find(i => i.type === 'foodBowl');
    const water = items.find(i => i.type === 'waterBowl');

    const roomRect = { x: 0, y: 0, width: room.width, height: room.height };

    // 規則 6: 設備不可超出房間
    items.forEach(it => {
        if (!rectInside(it, roomRect)) {
            errors.push({ id: it.id, msg: `${ITEM_LABELS[it.type].name}超出房間範圍` });
        }
    });

    // 規則 5: 不可重疊（fence 除外；飯碗/水碗可放在籠子內，建立正向連結）
    const overlapOk = (a, b) => {
        const types = new Set([a.type, b.type]);
        if (types.has('fence')) return true;
        if (types.has('crate') && (types.has('foodBowl') || types.has('waterBowl'))) return true;
        return false;
    };
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            if (overlapOk(a, b)) continue;
            if (rectsOverlap(a, b)) {
                errors.push({ id: a.id, msg: `${ITEM_LABELS[a.type].name}與${ITEM_LABELS[b.type].name}重疊` });
            }
        }
    }

    // 規則 4: 籠子/尿盆/飯碗/水碗應在圍欄內
    if (fence) {
        [crate, potty, bowl, water].forEach(it => {
            if (it && !rectInside(it, fence)) {
                errors.push({ id: it.id, msg: `${ITEM_LABELS[it.type].name}應放在圍欄內` });
            }
        });
    }

    // 規則 1: 尿盆距籠子 ≥ 30cm
    if (crate && potty) {
        const d = rectDistance(crate, potty);
        if (d < TRAINING_RULES.pottyToCrateMinDistance) {
            warnings.push({
                id: potty.id,
                msg: `尿盆離籠子太近（${Math.round(d)}cm，建議 ≥ ${TRAINING_RULES.pottyToCrateMinDistance}cm），狗狗可能不願在睡覺處附近上廁所`,
            });
        }
    }

    // 規則 2: 飯碗距尿盆 ≥ 50cm
    if (bowl && potty) {
        const d = rectDistance(bowl, potty);
        if (d < TRAINING_RULES.foodBowlToPottyMinDistance) {
            warnings.push({
                id: bowl.id,
                msg: `飯碗離尿盆太近（${Math.round(d)}cm，建議 ≥ ${TRAINING_RULES.foodBowlToPottyMinDistance}cm），衛生考量`,
            });
        }
    }

    // 規則 3: 圍欄內活動空間 ≥ 籠子面積 × 2
    if (fence && crate) {
        const fenceArea = fence.width * fence.height;
        const occupied = [crate, potty, bowl, water].reduce((sum, it) => sum + (it ? it.width * it.height : 0), 0);
        const free = fenceArea - occupied;
        const minFree = crate.width * crate.height * TRAINING_RULES.activityAreaCrateMultiplier;
        if (free < minFree) {
            warnings.push({
                id: fence.id,
                msg: `圍欄內活動空間不足（剩 ${Math.round(free)}cm²，建議 ≥ ${Math.round(minFree)}cm²）`,
            });
        }
    }

    return { errors, warnings };
}
