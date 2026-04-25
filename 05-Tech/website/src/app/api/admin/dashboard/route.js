import { NextResponse } from 'next/server';
import { isNotionConfigured, getCachedDashboardStats } from '@/lib/notion';

/**
 * GET /api/admin/dashboard
 *
 * Returns operational overview stats for the admin Overview page.
 * Powered by Notion CRM (customers + orders databases).
 *
 * Response shape:
 * {
 *   cards: {
 *     monthRevenue: number,       // 本月已付款訂單金額
 *     pendingPayment: number,     // ATM/超商待到帳金額
 *     activeOrderCount: number,   // 進行中課程數
 *     monthNewCustomers: number,  // 本月新增客戶數
 *   },
 *   funnel: [{ stage: string, count: number }],
 *   trainerWorkload: { [name]: { activeOrders: number, remainingSessions: number } },
 *   alerts: [{ severity: 'red'|'yellow'|'orange', message: string, orderId?, customerId? }],
 * }
 */
export async function GET() {
    // DEV mode: Notion not configured — return empty structure so UI renders cleanly
    if (!isNotionConfigured()) {
        console.log('[Dashboard] Notion not configured — returning empty data');
        return NextResponse.json({
            cards: { monthRevenue: 0, pendingPayment: 0, activeOrderCount: 0, monthNewCustomers: 0 },
            funnel: [],
            trainerWorkload: {},
            alerts: [],
            dev: true,
        });
    }

    try {
        const stats = await getCachedDashboardStats();
        return NextResponse.json(stats);
    } catch (err) {
        console.error('[Dashboard] Error fetching stats:', err);
        return NextResponse.json(
            { error: '取得 Dashboard 數據失敗', detail: err.message },
            { status: 500 }
        );
    }
}
