import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { sql } from '@/lib/db';
import { getMembersCount, getNewMembers, getUnsubscribedCount, getNewUnconfirmedCount, isGhostAdminConfigured } from '@/lib/ghost-admin';
import { getIGProfile, isIGConfigured } from '@/lib/instagram';
import { getSessionsAndUsers, getTrafficSources, getTopBlogPosts, getBookingFunnel, isGA4Configured } from '@/lib/ga4';

/**
 * MKT Analytics API.
 * GET /api/admin/analytics/mkt?section=instagram|newsletter|website&period=day|week|month|quarter|year
 */
export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const period = searchParams.get('period') || 'week';

    const result = {
        configured: {
            ghost: isGhostAdminConfigured(),
            instagram: isIGConfigured(),
            ga4: isGA4Configured(),
        },
    };

    const { startDate, sinceISO, trendDays } = getPeriodDates(period);

    // Newsletter section
    if (!section || section === 'newsletter') {
        if (isGhostAdminConfigured()) {
            const [totalSubscribers, newIn24h, unsubIn24h, unconfirmedIn24h] = await Promise.all([
                getMembersCount(),
                getNewMembers(sinceISO),
                getUnsubscribedCount(sinceISO),
                getNewUnconfirmedCount(sinceISO),
            ]);

            const trend = await getSnapshotTrend('ghost', trendDays);

            result.newsletter = {
                totalSubscribers,
                newIn24h,
                unsubIn24h,
                unconfirmedIn24h,
                trend,
            };
        } else {
            result.newsletter = null;
        }
    }

    // Instagram section
    if (!section || section === 'instagram') {
        if (isIGConfigured()) {
            const profile = await getIGProfile();
            const trend = await getSnapshotTrend('instagram', trendDays);
            const todaySnapshot = await getLatestSnapshot('instagram');

            result.instagram = {
                totalFollowers: profile?.followers_count ?? 0,
                newIn24h: todaySnapshot?.new_24h ?? 0,
                unfollowsIn24h: todaySnapshot?.unfollows_24h ?? 0,
                trend,
            };
        } else {
            result.instagram = null;
        }
    }

    // Website / GA4 section
    if (!section || section === 'website') {
        if (isGA4Configured()) {
            const [stats, sources, topPosts, funnel] = await Promise.all([
                getSessionsAndUsers(startDate, 'today'),
                getTrafficSources(startDate, 'today'),
                getTopBlogPosts(startDate, 'today', 10),
                getBookingFunnel(startDate, 'today'),
            ]);

            result.website = {
                sessions: stats?.sessions ?? 0,
                users: stats?.users ?? 0,
                pageViews: stats?.pageViews ?? 0,
                trafficSources: sources || [],
                topBlogPosts: topPosts || [],
                funnel: funnel || { pageViews: 0, contactClicks: 0, formSubmits: 0, conversionRate: '0' },
            };
        } else {
            result.website = null;
        }
    }

    return NextResponse.json(result);
}

function getPeriodDates(period) {
    const now = new Date();
    let daysBack;
    switch (period) {
        case 'day': daysBack = 1; break;
        case 'week': daysBack = 7; break;
        case 'month': daysBack = 30; break;
        case 'quarter': daysBack = 90; break;
        case 'year': daysBack = 365; break;
        default: daysBack = 7;
    }

    const since = new Date(now.getTime() - daysBack * 86400000);
    return {
        startDate: since.toISOString().split('T')[0],
        sinceISO: since.toISOString(),
        trendDays: daysBack,
    };
}

async function getSnapshotTrend(source, days) {
    try {
        const rows = await sql`
            SELECT metric_name, metric_value, snapshot_date
            FROM marketing_daily_snapshots
            WHERE metric_source = ${source}
            AND snapshot_date >= CURRENT_DATE - ${days}::integer
            ORDER BY snapshot_date ASC
        `;
        const byDate = {};
        for (const row of rows) {
            const date = row.snapshot_date instanceof Date
                ? row.snapshot_date.toISOString().split('T')[0]
                : String(row.snapshot_date).split('T')[0];
            if (!byDate[date]) byDate[date] = { date };
            byDate[date][row.metric_name] = Number(row.metric_value);
        }
        return Object.values(byDate);
    } catch {
        return [];
    }
}

async function getLatestSnapshot(source) {
    try {
        const rows = await sql`
            SELECT metric_name, metric_value
            FROM marketing_daily_snapshots
            WHERE metric_source = ${source}
            AND snapshot_date = CURRENT_DATE
        `;
        const result = {};
        for (const row of rows) {
            result[row.metric_name] = Number(row.metric_value);
        }
        return result;
    } catch {
        return {};
    }
}
