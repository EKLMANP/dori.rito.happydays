import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { cached } from '@/lib/cache';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const CACHE_TTL = 5 * 60_000; // 5 minutes

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const now = new Date();

        // Week boundaries (Mon–Sun)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const weekStart = monday.toISOString().split('T')[0];
        const weekEnd = sunday.toISOString().split('T')[0];

        // Month boundaries
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];

        // Run DB queries + Notion in parallel
        const [weeklyBookings, monthlyRevenue, pendingCount, recentBookings, revenueTrend, totalCustomers, systemHealth] =
            await Promise.all([
                // Weekly bookings
                sql`
                    SELECT COUNT(*) as count FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    AND booking_data->>'slotDate' >= ${weekStart}
                    AND booking_data->>'slotDate' <= ${weekEnd}
                `,
                // Monthly revenue
                sql`
                    SELECT COALESCE(SUM((booking_data->>'price')::int), 0) as total
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    AND booking_data->>'slotDate' >= ${monthStart}
                    AND booking_data->>'slotDate' <= ${monthEnd}
                `,
                // Upcoming bookings
                sql`
                    SELECT COUNT(*) as count FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    AND booking_data->>'slotDate' >= ${today}
                `,
                // Recent 10 bookings
                sql`
                    SELECT
                        merchant_trade_no,
                        booking_data->>'customerName' as customer_name,
                        booking_data->>'dogName' as dog_name,
                        booking_data->>'serviceName' as service_name,
                        booking_data->>'slotDate' as slot_date,
                        booking_data->>'slotTime' as slot_time,
                        (booking_data->>'price')::int as price,
                        booking_data->>'email' as email,
                        processed_at
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    ORDER BY booking_data->>'slotDate' DESC, booking_data->>'slotTime' DESC
                    LIMIT 10
                `,
                // Revenue trend: last 4 weeks
                sql`
                    SELECT
                        DATE_TRUNC('week', (booking_data->>'slotDate')::date)::date as week_start,
                        SUM((booking_data->>'price')::int) as revenue,
                        COUNT(*) as bookings
                    FROM processed_orders
                    WHERE processed_at IS NOT NULL
                    AND (booking_data->>'slotDate')::date >= CURRENT_DATE - INTERVAL '28 days'
                    GROUP BY week_start
                    ORDER BY week_start
                `,
                // Total customers from Notion (cached)
                fetchNotionCustomerCount(),
                // System health check
                checkSystemHealth(),
            ]);

        // Format revenue trend for charts
        const formattedTrend = revenueTrend.map((row) => {
            const d = new Date(row.week_start);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            return {
                week: label,
                revenue: parseInt(row.revenue || '0'),
                bookings: parseInt(row.bookings || '0'),
            };
        });

        return NextResponse.json({
            cards: {
                weeklyBookings: parseInt(weeklyBookings[0]?.count || '0'),
                monthlyRevenue: parseInt(monthlyRevenue[0]?.total || '0'),
                pendingCount: parseInt(pendingCount[0]?.count || '0'),
                totalCustomers,
            },
            revenueTrend: formattedTrend,
            recentBookings,
            systemHealth,
        });
    } catch (err) {
        console.error('[Analytics Overview] Error:', err);
        return NextResponse.json({ error: 'Failed to load overview data' }, { status: 500 });
    }
}

/** Fetch customer count from Notion CRM (cached 5 min) */
async function fetchNotionCustomerCount() {
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;

    if (!apiKey || !dbId) return 0;

    try {
        return await cached('notion-customer-count', CACHE_TTL, async () => {
            let count = 0;
            let cursor;

            do {
                const body = { page_size: 100 };
                if (cursor) body.start_cursor = cursor;

                const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Notion-Version': NOTION_VERSION,
                    },
                    body: JSON.stringify(body),
                });

                if (!res.ok) break;
                const data = await res.json();
                count += data.results.length;
                cursor = data.has_more ? data.next_cursor : null;
            } while (cursor);

            return count;
        });
    } catch {
        return 0;
    }
}

/** Quick health check of all integrated services */
async function checkSystemHealth() {
    const checks = await Promise.allSettled([
        sql`SELECT 1`.then(() => true),
        checkNotion(),
        checkGhost(),
        checkMailgun(),
    ]);

    return {
        db: checks[0].status === 'fulfilled' && checks[0].value === true,
        notion: checks[1].status === 'fulfilled' && checks[1].value === true,
        ghost: checks[2].status === 'fulfilled' && checks[2].value === true,
        mailgun: checks[3].status === 'fulfilled' && checks[3].value === true,
    };
}

async function checkNotion() {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) return false;
    const res = await fetch(`${NOTION_API}/users/me`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': NOTION_VERSION },
        signal: AbortSignal.timeout(5000),
    });
    return res.ok;
}

async function checkGhost() {
    const url = process.env.GHOST_URL;
    if (!url) return false;
    const res = await fetch(`${url}/ghost/api/content/settings/?key=${process.env.GHOST_CONTENT_API_KEY || 'none'}`, {
        signal: AbortSignal.timeout(5000),
    });
    return res.ok;
}

async function checkMailgun() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domain) return false;
    const res = await fetch(`https://api.mailgun.net/v3/${domain}/stats/total?event=delivered&duration=1h`, {
        headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` },
        signal: AbortSignal.timeout(5000),
    });
    return res.ok;
}
