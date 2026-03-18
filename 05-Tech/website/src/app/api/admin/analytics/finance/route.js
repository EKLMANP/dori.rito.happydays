import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const [monthlyTrend, serviceRevenue, avgPrice, unpaidOrders] = await Promise.all([
            // Monthly revenue trend (last 6 months)
            sql`
                SELECT
                    TO_CHAR((booking_data->>'slotDate')::date, 'YYYY-MM') as month,
                    SUM((booking_data->>'price')::int) as revenue,
                    COUNT(*) as bookings
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND (booking_data->>'slotDate')::date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY month
                ORDER BY month
            `,
            // Revenue by service
            sql`
                SELECT
                    booking_data->>'serviceName' as service,
                    SUM((booking_data->>'price')::int) as revenue,
                    COUNT(*) as count
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                GROUP BY service
                ORDER BY revenue DESC
            `,
            // Average order value
            sql`
                SELECT
                    ROUND(AVG((booking_data->>'price')::int)) as avg_price
                FROM processed_orders
                WHERE processed_at IS NOT NULL
            `,
            // Unpaid / pending orders
            sql`
                SELECT
                    merchant_trade_no,
                    booking_data->>'customerName' as customer_name,
                    booking_data->>'serviceName' as service_name,
                    booking_data->>'slotDate' as slot_date,
                    (booking_data->>'price')::int as price,
                    booking_data->>'email' as email,
                    created_at
                FROM processed_orders
                WHERE processed_at IS NULL
                ORDER BY created_at DESC
                LIMIT 20
            `,
        ]);

        // Format monthly trend with readable labels
        const formattedTrend = monthlyTrend.map((r) => {
            const [year, month] = r.month.split('-');
            return {
                month: `${parseInt(month)}月`,
                revenue: parseInt(r.revenue || '0'),
                bookings: parseInt(r.bookings || '0'),
                label: r.month,
            };
        });

        return NextResponse.json({
            monthlyTrend: formattedTrend,
            serviceRevenue: serviceRevenue.map((r) => ({
                service: r.service || '未知',
                revenue: parseInt(r.revenue || '0'),
                count: parseInt(r.count || '0'),
            })),
            avgPrice: parseInt(avgPrice[0]?.avg_price || '0'),
            unpaidOrders: unpaidOrders.map((r) => ({
                ...r,
                price: parseInt(r.price || '0'),
            })),
        });
    } catch (err) {
        console.error('[Analytics Finance] Error:', err);
        return NextResponse.json({ error: 'Failed to load finance data' }, { status: 500 });
    }
}
