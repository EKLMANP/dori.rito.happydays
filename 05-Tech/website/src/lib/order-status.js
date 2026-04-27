/**
 * Single source of truth for Order & Customer-Conversion status enums + badge styles.
 * Imported by both server (lib/notion.js) and client admin pages.
 */

// Order lifecycle (state machine in orders/[id]/page.js)
export const ORDER_STATUSES = ['報價中', '待排課', '已排課', '上課中', '完課', '已取消'];

// Buckets used to derive customer conversion status & aggregate progress
export const ACTIVE_ORDER_STATUSES = ['待排課', '已排課', '上課中'];
export const DONE_ORDER_STATUSES = ['完課'];
export const CANCELLED_ORDER_STATUSES = ['已取消'];

// Customer conversion enum (4 simplified buckets)
export const CONVERSION_STATUSES = ['未開始', '進行中', '已完成', '已流失'];

// Days a quote (報價中) can sit before being treated as 已流失
export const LOST_AFTER_DAYS = 30;

export const ORDER_STATUS_BADGE_STYLES = {
    '報價中': 'bg-gray-100 text-gray-700',
    '待排課': 'bg-blue-100 text-blue-700',
    '已排課': 'bg-indigo-100 text-indigo-700',
    '上課中': 'bg-yellow-100 text-yellow-700',
    '完課': 'bg-green-100 text-green-700',
    '已取消': 'bg-red-100 text-red-700',
    // Payment status badges (keep here for shared StatusBadge components)
    '待付款': 'bg-orange-100 text-orange-700',
    '付款中': 'bg-yellow-100 text-yellow-700',
    '已付款': 'bg-green-100 text-green-700',
    '付款失敗': 'bg-red-100 text-red-700',
    // Legacy values that may still appear from old Notion records
    '未開始': 'bg-gray-100 text-gray-500',
};

export const CONVERSION_BADGE_STYLES = {
    '未開始': 'bg-gray-100 text-gray-700',
    '進行中': 'bg-yellow-100 text-yellow-700',
    '已完成': 'bg-green-100 text-green-700',
    '已流失': 'bg-red-100 text-red-700',
};

/**
 * Derive a customer's conversion status from their orders.
 * Pure function — caller passes already-formatted orders (must include orderStatus, createdTime).
 */
export function deriveConversionStatus(customerOrders) {
    if (!customerOrders || customerOrders.length === 0) return '未開始';

    const hasActive = customerOrders.some(o => ACTIVE_ORDER_STATUSES.includes(o.orderStatus));
    if (hasActive) return '進行中';

    const hasDone = customerOrders.some(o => DONE_ORDER_STATUSES.includes(o.orderStatus));
    if (hasDone) return '已完成';

    // Only quotes / cancelled remain. If everything is cancelled, OR a stale quote sits past LOST_AFTER_DAYS → lost.
    const allCancelled = customerOrders.every(o => CANCELLED_ORDER_STATUSES.includes(o.orderStatus));
    if (allCancelled) return '已流失';

    const cutoff = Date.now() - LOST_AFTER_DAYS * 86400000;
    const stale = customerOrders.every(o => {
        if (o.orderStatus !== '報價中') return true; // ignored buckets fall through
        const t = o.createdTime ? new Date(o.createdTime).getTime() : Date.now();
        return t < cutoff;
    });
    if (stale) return '已流失';

    return '未開始';
}

/**
 * Aggregate session progress across a customer's ACTIVE orders.
 * Returns { purchasedSessions, usedSessions, remainingSessions, orderCount, totalSpent }.
 */
export function aggregateOrderStats(customerOrders) {
    const stats = {
        orderCount: 0,
        totalSpent: 0,
        purchasedSessions: 0,
        usedSessions: 0,
        remainingSessions: 0,
    };

    for (const o of customerOrders) {
        if (CANCELLED_ORDER_STATUSES.includes(o.orderStatus)) continue;
        stats.orderCount += 1;

        if (o.paymentStatus === '已付款') {
            stats.totalSpent += o.totalAmount || 0;
        }

        if (ACTIVE_ORDER_STATUSES.includes(o.orderStatus)) {
            const purchased = o.sessions || 0;
            const remaining = o.remainingSessions ?? purchased;
            stats.purchasedSessions += purchased;
            stats.remainingSessions += remaining;
            stats.usedSessions += Math.max(0, purchased - remaining);
        }
    }

    return stats;
}
