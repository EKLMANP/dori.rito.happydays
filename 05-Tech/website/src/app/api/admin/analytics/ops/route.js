import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { evaluateAlerts, OPS_RULES } from '@/lib/alerts/index.js';

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const today = new Date().toISOString().split('T')[0];
        const next7 = new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0];
        const next14 = new Date(Date.now() + 14 * 86400_000).toISOString().split('T')[0];

        const [
            completionRate,
            serviceBreakdown,
            timeSlotHeat,
            avgDaysAhead,
            upcomingBookings,
            upcomingBookings14d,
            pendingAssignmentResult,
            demandByHour14d,
        ] = await Promise.all([
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
            // Upcoming 14-day bookings (for capacity planning)
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
                AND booking_data->>'slotDate' <= ${next14}
                ORDER BY booking_data->>'slotDate', booking_data->>'slotTime'
            `,
            // Pending assignment: paid orders with upcoming slot but no trainer assigned
            sql`
                SELECT COUNT(*) as count
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND (
                    booking_data->>'trainer' IS NULL
                    OR booking_data->>'trainer' = ''
                )
                AND booking_data->>'slotDate' >= ${today}
            `,
            // Slot demand by hour for next 14 days
            sql`
                SELECT
                    SPLIT_PART(booking_data->>'slotTime', ':', 1) as hour,
                    COUNT(*) as count
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND booking_data->>'slotDate' >= ${today}
                AND booking_data->>'slotDate' <= ${next14}
                AND booking_data->>'slotTime' IS NOT NULL
                GROUP BY hour
                ORDER BY hour
            `,
        ]);

        const completed = parseInt(completionRate[0]?.completed || '0');
        const total = parseInt(completionRate[0]?.total || '0');
        const pendingCount = parseInt(pendingAssignmentResult[0]?.count || '0');

        const completionRateValue = total > 0 ? Math.round((completed / total) * 100) : 0;
        const avgDaysAheadValue = parseFloat(avgDaysAhead[0]?.avg_days || '0');

        const metrics = {
            completionRate: completionRateValue,
            avgDaysAhead: avgDaysAheadValue,
            cancellationRate: 0, // placeholder until cancellation tracking is confirmed
            pendingAssignment: pendingCount,
        };
        const alerts = evaluateAlerts(OPS_RULES, metrics);

        return NextResponse.json({
            completionRate: {
                completed,
                total,
                rate: completionRateValue,
            },
            serviceBreakdown: serviceBreakdown.map((r) => ({
                service: r.service || '未知',
                count: parseInt(r.count),
            })),
            timeSlotHeat: timeSlotHeat.map((r) => ({
                timeSlot: r.time_slot || '未知',
                count: parseInt(r.count),
            })),
            avgDaysAhead: avgDaysAheadValue,
            upcomingBookings,
            upcomingBookings14d,
            pendingAssignment: pendingCount,
            demandByHour14d: demandByHour14d.map((r) => ({
                hour: r.hour || '未知',
                count: parseInt(r.count),
            })),
            alerts,
        });
    } catch (err) {
        console.error('[Analytics Ops] Error:', err);
        return NextResponse.json({ error: 'Failed to load operations data' }, { status: 500 });
    }
}
