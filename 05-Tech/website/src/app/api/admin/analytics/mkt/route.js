import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * MKT Analytics — Phase 1 placeholder.
 * Real data will be added in Phase 2 (Ghost + Mailgun stats).
 */
export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    return NextResponse.json({
        phase: 1,
        message: 'MKT 詳細指標將在 Phase 2 上線',
        availableInPhase2: [
            '電子報訂閱人數',
            '電子報訂閱成長趨勢',
            '交易信寄送成功率',
            '交易信開信率',
            '交易信點擊率',
            '部落格文章總數',
        ],
        availableInPhase3: [
            '網站流量 (sessions/users)',
            '流量來源分布',
            '部落格文章瀏覽排行',
            '預約頁轉換率',
        ],
    });
}
