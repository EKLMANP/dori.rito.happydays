import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { evaluateAlerts, FINANCE_RULES } from '@/lib/alerts/index.js';

export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const period = searchParams.get('period') || 'month';

    if (section === 'trend') {
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';
        try {
            return NextResponse.json(await fetchTrendData(period, startDate, endDate));
        } catch (err) {
            console.error('[Analytics Finance Trend] Error:', err);
            return NextResponse.json({ error: 'Failed to load trend data' }, { status: 500 });
        }
    }

    try {
        const [
            monthlyTrend,
            serviceRevenue,
            avgPrice,
            unpaidOrders,
            lastMonthRevenue,
            thisMonthRevenue,
            unpaidAgingRows,
            deferredRevenueRow,
        ] = await Promise.all([
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
            // Revenue by service (with count for unit economics)
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
                ORDER BY merchant_trade_no DESC
                LIMIT 20
            `,
            // Last month revenue (for MoM change)
            sql`
                SELECT COALESCE(SUM((booking_data->>'price')::int), 0)::int as revenue
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND DATE_TRUNC('month', processed_at) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
            `,
            // This month revenue (for MoM change)
            sql`
                SELECT COALESCE(SUM((booking_data->>'price')::int), 0)::int as revenue
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND DATE_TRUNC('month', processed_at) = DATE_TRUNC('month', CURRENT_DATE)
            `,
            // Unpaid orders with created_at for aging buckets
            sql`
                SELECT created_at
                FROM processed_orders
                WHERE processed_at IS NULL
            `,
            // Deferred revenue: paid but slot date in the future
            sql`
                SELECT COALESCE(SUM((booking_data->>'price')::int), 0)::int as deferred
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND (booking_data->>'slotDate')::date > CURRENT_DATE
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

        // MoM revenue change
        const lastMonthRev = lastMonthRevenue[0]?.revenue || 0;
        const thisMonthRev = thisMonthRevenue[0]?.revenue || 0;
        let revenueMomChange = 0;
        if (lastMonthRev > 0) {
            revenueMomChange = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
        }

        // Unpaid aging buckets
        const now = Date.now();
        const unpaidAging = { under24h: 0, h24to72: 0, over72h: 0 };
        for (const row of unpaidAgingRows) {
            const createdAt = row.created_at ? new Date(row.created_at).getTime() : now;
            const ageHours = (now - createdAt) / (1000 * 60 * 60);
            if (ageHours < 24) {
                unpaidAging.under24h += 1;
            } else if (ageHours <= 72) {
                unpaidAging.h24to72 += 1;
            } else {
                unpaidAging.over72h += 1;
            }
        }

        // Unit economics per service
        const serviceUnitEcon = serviceRevenue.map((r) => {
            const count = parseInt(r.count || '0');
            const totalRevenue = parseInt(r.revenue || '0');
            return {
                service: r.service || '未知',
                count,
                totalRevenue,
                avgPrice: count > 0 ? Math.round(totalRevenue / count) : 0,
            };
        });

        // Deferred revenue
        const deferredRevenue = deferredRevenueRow[0]?.deferred || 0;

        // Finance alerts
        const alertMetrics = {
            revenueMomChange,
            unpaidOver72h: unpaidAging.over72h,
            aovChange: 0, // placeholder
        };
        const alerts = evaluateAlerts(FINANCE_RULES, alertMetrics);

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
            revenueMomChange,
            unpaidAging,
            serviceUnitEcon,
            deferredRevenue,
            alerts,
        });
    } catch (err) {
        console.error('[Analytics Finance] Error:', err);
        return NextResponse.json({ error: 'Failed to load finance data' }, { status: 500 });
    }
}

async function fetchTrendData(period, startDate = '', endDate = '') {
    const truncUnit = period === 'year' ? 'year' : period === 'quarter' ? 'quarter' : 'month';

    let revenueRows, serviceMixRows;

    if (startDate && endDate) {
        // Custom range: startDate and endDate are YYYY-MM strings
        const start = `${startDate}-01`;
        const [ey, em] = endDate.split('-').map(Number);
        const endExclusive = new Date(ey, em, 1); // first day of month AFTER endDate
        const end = `${endExclusive.getFullYear()}-${String(endExclusive.getMonth() + 1).padStart(2, '0')}-01`;

        [revenueRows, serviceMixRows] = await Promise.all([
            sql`
                SELECT
                    TO_CHAR(DATE_TRUNC(${truncUnit}, processed_at), 'YYYY-MM') as period,
                    SUM((booking_data->>'price')::int) as revenue,
                    COUNT(*) as bookings
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND processed_at >= ${start}::date
                AND processed_at < ${end}::date
                GROUP BY 1 ORDER BY 1
            `,
            sql`
                SELECT
                    TO_CHAR(DATE_TRUNC(${truncUnit}, processed_at), 'YYYY-MM') as period,
                    booking_data->>'serviceName' as service,
                    SUM((booking_data->>'price')::int) as revenue
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND processed_at >= ${start}::date
                AND processed_at < ${end}::date
                GROUP BY 1, 2 ORDER BY 1, 3 DESC
            `,
        ]);
    } else {
        const intervals = { month: '12 months', quarter: '2 years', year: '10 years' };
        const intervalStr = intervals[period] || '12 months';

        [revenueRows, serviceMixRows] = await Promise.all([
            sql`
                SELECT
                    TO_CHAR(DATE_TRUNC(${truncUnit}, processed_at), 'YYYY-MM') as period,
                    SUM((booking_data->>'price')::int) as revenue,
                    COUNT(*) as bookings
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND processed_at >= CURRENT_DATE - CAST(${intervalStr} AS INTERVAL)
                GROUP BY 1 ORDER BY 1
            `,
            sql`
                SELECT
                    TO_CHAR(DATE_TRUNC(${truncUnit}, processed_at), 'YYYY-MM') as period,
                    booking_data->>'serviceName' as service,
                    SUM((booking_data->>'price')::int) as revenue
                FROM processed_orders
                WHERE processed_at IS NOT NULL
                AND processed_at >= CURRENT_DATE - CAST(${intervalStr} AS INTERVAL)
                GROUP BY 1, 2 ORDER BY 1, 3 DESC
            `,
        ]);
    }

    const formatLabel = (p) => {
        const [y, m] = p.split('-');
        if (period === 'year') return `${y}年`;
        if (period === 'quarter') return `Q${Math.ceil(parseInt(m) / 3)} '${y.slice(2)}`;
        return `${y.slice(2)}/${m}`;
    };

    const revenueTrend = revenueRows.map((r) => ({
        label: formatLabel(r.period),
        revenue: parseInt(r.revenue || 0),
        bookings: parseInt(r.bookings || 0),
    }));

    // Pivot service mix → % per period
    const periods = [...new Set(serviceMixRows.map((r) => r.period))].sort();
    const services = [...new Set(serviceMixRows.map((r) => r.service).filter(Boolean))];
    const lookup = {};
    serviceMixRows.forEach((r) => {
        if (!lookup[r.period]) lookup[r.period] = {};
        lookup[r.period][r.service] = parseInt(r.revenue || 0);
    });

    const serviceMixTrend = periods.map((p) => {
        const row = { label: formatLabel(p) };
        const total = Object.values(lookup[p] || {}).reduce((s, v) => s + v, 0);
        services.forEach((svc) => {
            row[svc] = total > 0 ? Math.round(((lookup[p]?.[svc] || 0) / total) * 100) : 0;
        });
        return row;
    });

    // Also include absolute revenue per service per period
    const serviceMixRevenue = periods.map((p) => {
        const row = { label: formatLabel(p) };
        services.forEach((svc) => { row[svc] = lookup[p]?.[svc] || 0; });
        return row;
    });

    return { revenueTrend, serviceMixTrend, serviceMixRevenue, services };
}
