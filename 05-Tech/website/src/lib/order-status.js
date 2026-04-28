/**
 * Single source of truth for Order & Customer-Conversion status enums + badge styles.
 * Imported by both server (lib/notion.js) and client admin pages.
 *
 * Notion 「訂單狀態」目前選項：未開始 / 待排課 / 已排課 / 上課中 / 完課
 * 取消語意統一在「付款狀態 = 付款失敗」，訂單狀態內已無 已取消。
 */

// Order lifecycle (state machine in orders/[id]/page.js)
export const ORDER_STATUSES = ['未開始', '待排課', '已排課', '上課中', '完課'];

// Buckets used to derive customer conversion status & aggregate progress
export const ACTIVE_ORDER_STATUSES = ['待排課', '已排課', '上課中'];
export const DONE_ORDER_STATUSES = ['完課'];

// Cancellation lives on payment status now (Notion 訂單狀態 已無 已取消)
export const CANCELLED_PAYMENT_STATUSES = ['付款失敗'];

// Customer conversion enum (4 simplified buckets)
export const CONVERSION_STATUSES = ['未開始', '進行中', '已完成', '已流失'];

// Days a 未開始 order can sit before being treated as 已流失
export const LOST_AFTER_DAYS = 30;

export const ORDER_STATUS_BADGE_STYLES = {
    '未開始': 'bg-gray-100 text-gray-500',
    '待排課': 'bg-blue-100 text-blue-700',
    '已排課': 'bg-indigo-100 text-indigo-700',
    '上課中': 'bg-yellow-100 text-yellow-700',
    '完課': 'bg-green-100 text-green-700',
    // Payment status badges (keep here for shared StatusBadge components)
    '待付款': 'bg-orange-100 text-orange-700',
    '付款中': 'bg-yellow-100 text-yellow-700',
    '已付款': 'bg-green-100 text-green-700',
    '付款失敗': 'bg-red-100 text-red-700',
    // Legacy fallback for historical records that may still carry 已取消
    '已取消': 'bg-red-100 text-red-700',
};

export const CONVERSION_BADGE_STYLES = {
    '未開始': 'bg-gray-100 text-gray-700 ring-1 ring-gray-300',
    '進行中': 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',
    '已完成': 'bg-green-100 text-green-800 ring-1 ring-green-300',
    '已流失': 'bg-red-100 text-red-700 ring-1 ring-red-300',
};

/** Treat an order as cancelled by looking at its payment status. */
export function isOrderCancelled(order) {
    return CANCELLED_PAYMENT_STATUSES.includes(order?.paymentStatus);
}

/**
 * Derive a customer's conversion status from their orders.
 * Pure function — caller passes already-formatted orders (must include orderStatus, paymentStatus, createdTime).
 */
export function deriveConversionStatus(customerOrders) {
    if (!customerOrders || customerOrders.length === 0) return '未開始';

    const liveOrders = customerOrders.filter(o => !isOrderCancelled(o));

    const hasActive = liveOrders.some(o => ACTIVE_ORDER_STATUSES.includes(o.orderStatus));
    if (hasActive) return '進行中';

    const hasDone = liveOrders.some(o => DONE_ORDER_STATUSES.includes(o.orderStatus));
    if (hasDone) return '已完成';

    // No live orders left → all cancelled
    if (liveOrders.length === 0) return '已流失';

    // Only 未開始 orders remain. If all of them are stale past LOST_AFTER_DAYS → lost.
    const cutoff = Date.now() - LOST_AFTER_DAYS * 86400000;
    const allStale = liveOrders.every(o => {
        if (o.orderStatus !== '未開始') return true; // ignored buckets fall through
        const t = o.createdTime ? new Date(o.createdTime).getTime() : Date.now();
        return t < cutoff;
    });
    if (allStale) return '已流失';

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
        if (isOrderCancelled(o)) continue;
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
