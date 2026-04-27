import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/cron/expire-payments
 *
 * Scans for orders whose payment_expire_at has passed but are still in_progress.
 * Marks them cancelled/failed and notifies the CS team via Telegram.
 *
 * Runs every 30 minutes via Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET header.
 */
export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find expired in-progress orders
    const expired = await sql`
        SELECT merchant_trade_no, booking_data, notion_order_id
        FROM processed_orders
        WHERE payment_status = 'in_progress'
          AND payment_expire_at IS NOT NULL
          AND payment_expire_at < NOW()
    `;

    if (expired.length === 0) {
        return NextResponse.json({ cancelled: 0 });
    }

    const results = [];
    const apiKey = process.env.NOTION_API_KEY_CRM || process.env.NOTION_API_KEY;

    for (const row of expired) {
        const tradeNo = row.merchant_trade_no;
        try {
            await sql`
                UPDATE processed_orders
                SET payment_status = 'cancelled',
                    order_status   = 'cancelled'
                WHERE merchant_trade_no = ${tradeNo}
                  AND payment_status    = 'in_progress'
            `;

            // Sync Notion order
            if (row.notion_order_id && apiKey) {
                try {
                    await fetch(`https://api.notion.com/v1/pages/${row.notion_order_id}`, {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'Notion-Version': '2022-06-28',
                        },
                        body: JSON.stringify({
                            properties: {
                                '付款狀態': { status: { name: '付款失敗' } },
                            },
                        }),
                    });
                } catch (notionErr) {
                    console.warn(`[expire-payments] Notion update failed for ${tradeNo}:`, notionErr.message);
                }
            }

            results.push({ tradeNo, status: 'cancelled' });
            console.log(`[expire-payments] Cancelled expired order: ${tradeNo}`);
        } catch (err) {
            console.error(`[expire-payments] Failed to cancel ${tradeNo}:`, err.message);
            results.push({ tradeNo, status: 'error', error: err.message });
        }
    }

    // Notify CS team via Telegram if any orders were cancelled
    const cancelled = results.filter((r) => r.status === 'cancelled');
    if (cancelled.length > 0) {
        const botToken = process.env.TELEGRAM_DR_FNACC_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_GROUP_DR_CS_TEAM;
        if (botToken && chatId) {
            const lines = cancelled.map((r) => `• ${r.tradeNo}`).join('\n');
            const msg = `⏰ 自動取消 ${cancelled.length} 筆逾期未繳訂單：\n${lines}`;
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: msg }),
            }).catch(() => {});
        }
    }

    return NextResponse.json({ cancelled: cancelled.length, results });
}
