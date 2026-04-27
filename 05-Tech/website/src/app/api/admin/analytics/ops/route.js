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
            pendingAssignmentOrders,
            heatmap14d,
            todayStats,
            repurchaseStats,
            slaOverdueOrders,
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
            // Pending assignment orders (with details for table)
            sql`
                SELECT
                    merchant_trade_no,
                    booking_data->>'customerName' as customer_name,
                    booking_data->>'serviceName' as service_name,
                    booking_data->>'slotDate' as slot_date,
                    booking_data->>'slotTime' as slot_time,
                    processed_at
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND (booking_data->>'trainer' IS NULL OR booking_data->>'trainer' = '')
                AND booking_data->>'slotDate' >= ${today}
                ORDER BY booking_data->>'slotDate', booking_data->>'slotTime'
                LIMIT 20
            `,
            // 14-day heatmap: bookings by date × hour
            sql`
                SELECT
                    booking_data->>'slotDate' as slot_date,
                    SPLIT_PART(booking_data->>'slotTime', ':', 1) as hour,
                    COUNT(*) as count
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND booking_data->>'slotDate' >= ${today}
                AND booking_data->>'slotDate' <= ${next14}
                AND booking_data->>'slotTime' IS NOT NULL
                GROUP BY slot_date, hour
                ORDER BY slot_date, hour
            `,
            // Today's stats
            sql`
                SELECT
                    COUNT(*) FILTER (WHERE booking_data->>'slotDate' = ${today}) as today_bookings,
                    COUNT(*) FILTER (
                        WHERE booking_data->>'slotDate' = ${today}
                        AND processed_at IS NULL
                    ) as today_unpaid
                FROM processed_orders
            `,
            // Repurchase rate: customers with >1 paid order
            sql`
                SELECT
                    COUNT(*) as total_customers,
                    COUNT(*) FILTER (WHERE order_count > 1) as repeat_customers
                FROM (
                    SELECT booking_data->>'customerName' as name, COUNT(*) as order_count
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    GROUP BY name
                ) sub
            `,
            // SLA overdue: paid > 4h ago, upcoming slot, no trainer assigned
            sql`
                SELECT
                    merchant_trade_no,
                    booking_data->>'customerName' as customer_name,
                    booking_data->>'serviceName' as service_name,
                    booking_data->>'slotDate' as slot_date,
                    processed_at,
                    ROUND(EXTRACT(EPOCH FROM (NOW() - processed_at)) / 3600, 1) as hours_since_paid
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND processed_at < NOW() - INTERVAL '4 hours'
                AND (booking_data->>'trainer' IS NULL OR booking_data->>'trainer' = '')
                AND booking_data->>'slotDate' >= ${today}
                ORDER BY processed_at ASC
                LIMIT 10
            `,
        ]);

        const completed = parseInt(completionRate[0]?.completed || '0');
        const total = parseInt(completionRate[0]?.total || '0');
        const pendingCount = pendingAssignmentOrders.length;

        const completionRateValue = total > 0 ? Math.round((completed / total) * 100) : 0;
        const avgDaysAheadValue = parseFloat(avgDaysAhead[0]?.avg_days || '0');

        // Repurchase rate
        const totalCustomers = parseInt(repurchaseStats[0]?.total_customers || '0');
        const repeatCustomers = parseInt(repurchaseStats[0]?.repeat_customers || '0');
        const repurchaseRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

        // Online vs offline classification
        const onlineKeywords = ['線上', 'online', 'Online'];
        const serviceOnlineMap = serviceBreakdown.reduce((acc, r) => {
            const name = r.service || '';
            const isOnline = onlineKeywords.some((k) => name.includes(k));
            const key = isOnline ? '線上' : '線下';
            acc[key] = (acc[key] || 0) + parseInt(r.count);
            return acc;
        }, {});
        const onlineOfflineBreakdown = Object.entries(serviceOnlineMap).map(([type, count]) => ({ type, count }));

        const metrics = {
            completionRate: completionRateValue,
            avgDaysAhead: avgDaysAheadValue,
            cancellationRate: 0,
            pendingAssignment: pendingCount,
        };
        const alerts = evaluateAlerts(OPS_RULES, metrics);

        return NextResponse.json({
            // Today summary
            todayStats: {
                bookings: parseInt(todayStats[0]?.today_bookings || '0'),
                unassigned: pendingCount,
                pendingPayment: parseInt(todayStats[0]?.today_unpaid || '0'),
                cancellations: 0, // placeholder
            },
            // Existing metrics
            completionRate: { completed, total, rate: completionRateValue },
            avgDaysAhead: avgDaysAheadValue,
            serviceBreakdown: serviceBreakdown.map((r) => ({
                service: r.service || '未知',
                count: parseInt(r.count),
            })),
            timeSlotHeat: timeSlotHeat.map((r) => ({
                timeSlot: r.time_slot || '未知',
                count: parseInt(r.count),
            })),
            // Quality metrics
            qualityMetrics: {
                cancellationRate: 0,
                rescheduleRate: 0,
                noShowRate: 0,
                repurchaseRate,
            },
            // Online vs offline
            onlineOfflineBreakdown,
            // Heatmap: [{ slotDate, hour, count }]
            heatmap14d: heatmap14d.map((r) => ({
                slotDate: r.slot_date,
                hour: r.hour,
                count: parseInt(r.count),
            })),
            // Flow health
            pendingAssignment: pendingCount,
            pendingAssignmentOrders: pendingAssignmentOrders.map((r) => ({
                tradeNo: r.merchant_trade_no,
                customerName: r.customer_name,
                serviceName: r.service_name,
                slotDate: r.slot_date,
                slotTime: r.slot_time,
                processedAt: r.processed_at,
            })),
            slaOverdueOrders: slaOverdueOrders.map((r) => ({
                tradeNo: r.merchant_trade_no,
                customerName: r.customer_name,
                serviceName: r.service_name,
                slotDate: r.slot_date,
                hoursSincePaid: parseFloat(r.hours_since_paid),
            })),
            // Preserved
            upcomingBookings,
            alerts,
        });
    } catch (err) {
        console.error('[Analytics Ops] Error:', err);
        return NextResponse.json({ error: 'Failed to load operations data' }, { status: 500 });
    }
}
