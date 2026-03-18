import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { sql } from '@/lib/db';

/**
 * Customer search — query processed_orders by order number, customer name, or phone.
 *
 * GET /api/admin/analytics/cs/search?q=搜尋關鍵字
 *
 * Returns matching orders with: 訂單編號, 客戶姓名, 手機, 付款金額, 付款日期時間, 服務名稱
 */
export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
        return NextResponse.json({ results: [], query: '' });
    }

    try {
        // Search across merchant_trade_no (order ID), customerName, and phone in JSONB
        const results = await sql`
            SELECT
                merchant_trade_no,
                booking_data->>'customerName' AS customer_name,
                booking_data->>'phone' AS phone,
                booking_data->>'email' AS email,
                booking_data->>'serviceName' AS service_name,
                COALESCE((booking_data->>'price')::int, (booking_data->>'tradeAmt')::int, 0) AS price,
                booking_data->>'slotDate' AS slot_date,
                booking_data->>'slotTime' AS slot_time,
                booking_data->>'paymentDate' AS payment_date,
                booking_data->>'paymentType' AS payment_type,
                booking_data->>'dogName' AS dog_name,
                processed_at
            FROM processed_orders
            WHERE
                merchant_trade_no ILIKE ${'%' + q + '%'}
                OR booking_data->>'customerName' ILIKE ${'%' + q + '%'}
                OR booking_data->>'phone' ILIKE ${'%' + q + '%'}
            ORDER BY processed_at DESC NULLS LAST
            LIMIT 50
        `;

        return NextResponse.json({
            results: results.map((r) => ({
                merchantTradeNo: r.merchant_trade_no,
                customerName: r.customer_name || '—',
                phone: r.phone || '—',
                email: r.email || '—',
                serviceName: r.service_name || '—',
                price: r.price,
                slotDate: r.slot_date || '—',
                slotTime: r.slot_time || '—',
                paymentDate: r.payment_date || null,
                paymentType: r.payment_type || '—',
                dogName: r.dog_name || '—',
                processedAt: r.processed_at,
            })),
            query: q,
            total: results.length,
        });
    } catch (err) {
        console.error('[CS Search] Error:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
