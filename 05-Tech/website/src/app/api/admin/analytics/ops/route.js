import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const today = new Date().toISOString().split('T')[0];
        const next7 = new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0];

        const [completionRate, serviceBreakdown, timeSlotHeat, avgDaysAhead, upcomingBookings] =
            await Promise.all([
                // Completion rate
                sql`
                    SELECT
                        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as completed,
                        COUNT(*) as total
                    FROM processed_orders
                `,
                // Service breakdown (paid orders only)
                sql`
                    SELECT
                        booking_data->>'serviceName' as service,
                        COUNT(*) as count
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    GROUP BY service
                    ORDER BY count DESC
                `,
                // Time slot popularity
                sql`
                    SELECT
                        booking_data->>'slotTime' as time_slot,
                        COUNT(*) as count
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    GROUP BY time_slot
                    ORDER BY count DESC
                `,
                // Average days booked in advance
                sql`
                    SELECT
                        ROUND(AVG(
                            (booking_data->>'slotDate')::date - processed_at::date
                        ), 1) as avg_days
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    AND (booking_data->>'slotDate')::date >= processed_at::date
                `,
                // Upcoming 7-day bookings
                sql`
                    SELECT
                        booking_data->>'customerName' as customer_name,
                        booking_data->>'dogName' as dog_name,
                        booking_data->>'serviceName' as service_name,
                        booking_data->>'slotDate' as slot_date,
                        booking_data->>'slotTime' as slot_time,
                        (booking_data->>'price')::int as price
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    AND booking_data->>'slotDate' >= ${today}
                    AND booking_data->>'slotDate' <= ${next7}
                    ORDER BY booking_data->>'slotDate', booking_data->>'slotTime'
                `,
            ]);

        const completed = parseInt(completionRate[0]?.completed || '0');
        const total = parseInt(completionRate[0]?.total || '0');

        return NextResponse.json({
            completionRate: {
                completed,
                total,
                rate: total > 0 ? Math.round((completed / total) * 100) : 0,
            },
            serviceBreakdown: serviceBreakdown.map((r) => ({
                service: r.service || '未知',
                count: parseInt(r.count),
            })),
            timeSlotHeat: timeSlotHeat.map((r) => ({
                timeSlot: r.time_slot || '未知',
                count: parseInt(r.count),
            })),
            avgDaysAhead: parseFloat(avgDaysAhead[0]?.avg_days || '0'),
            upcomingBookings,
        });
    } catch (err) {
        console.error('[Analytics Ops] Error:', err);
        return NextResponse.json({ error: 'Failed to load operations data' }, { status: 500 });
    }
}
