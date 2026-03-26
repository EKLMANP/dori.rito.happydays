import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getMembersCount, getNewMembers, getUnsubscribedCount, getNewUnconfirmedCount, isGhostAdminConfigured } from '@/lib/ghost-admin';
import { getIGProfile, isIGConfigured } from '@/lib/instagram';

/**
 * Daily marketing metrics snapshot.
 * Triggered by Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 *
 * GET /api/cron/marketing-snapshot
 */
export async function GET(request) {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = { ghost: null, instagram: null };
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    // Ensure table exists
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS marketing_daily_snapshots (
                id SERIAL PRIMARY KEY,
                metric_source VARCHAR(20) NOT NULL,
                metric_name VARCHAR(50) NOT NULL,
                metric_value NUMERIC NOT NULL,
                snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(metric_source, metric_name, snapshot_date)
            )
        `;
    } catch (err) {
        // Table likely already exists
        if (!err.message?.includes('already exists')) {
            console.error('[Cron] Table creation error:', err.message);
        }
    }

    // Ghost Newsletter metrics
    if (isGhostAdminConfigured()) {
        try {
            const totalSubscribers = await getMembersCount();
            const newIn24h = await getNewMembers(yesterday);
            const unsubIn24h = await getUnsubscribedCount(yesterday);
            const unconfirmedIn24h = await getNewUnconfirmedCount(yesterday);

            const metrics = [
                { name: 'total_subscribers', value: totalSubscribers },
                { name: 'new_24h', value: newIn24h },
                { name: 'unsub_24h', value: unsubIn24h },
                { name: 'unconfirmed_24h', value: unconfirmedIn24h },
            ];

            for (const m of metrics) {
                await sql`
                    INSERT INTO marketing_daily_snapshots (metric_source, metric_name, metric_value, snapshot_date)
                    VALUES ('ghost', ${m.name}, ${m.value}, ${today})
                    ON CONFLICT (metric_source, metric_name, snapshot_date)
                    DO UPDATE SET metric_value = ${m.value}, created_at = NOW()
                `;
            }

            results.ghost = { totalSubscribers, newIn24h, unsubIn24h, unconfirmedIn24h };
        } catch (err) {
            console.error('[Cron] Ghost snapshot error:', err.message);
            results.ghost = { error: err.message };
        }
    }

    // Instagram metrics
    if (isIGConfigured()) {
        try {
            const profile = await getIGProfile();
            if (profile) {
                await sql`
                    INSERT INTO marketing_daily_snapshots (metric_source, metric_name, metric_value, snapshot_date)
                    VALUES ('instagram', 'total_followers', ${profile.followers_count}, ${today})
                    ON CONFLICT (metric_source, metric_name, snapshot_date)
                    DO UPDATE SET metric_value = ${profile.followers_count}, created_at = NOW()
                `;

                // Calculate new/unfollows from previous day
                const prevRows = await sql`
                    SELECT metric_value FROM marketing_daily_snapshots
                    WHERE metric_source = 'instagram' AND metric_name = 'total_followers'
                    AND snapshot_date = ${today}::date - interval '1 day'
                `;
                const prevTotal = prevRows[0]?.metric_value ?? profile.followers_count;
                const diff = profile.followers_count - Number(prevTotal);
                const newFollowers = Math.max(diff, 0);
                const unfollows = Math.max(-diff, 0);

                await sql`
                    INSERT INTO marketing_daily_snapshots (metric_source, metric_name, metric_value, snapshot_date)
                    VALUES ('instagram', 'new_24h', ${newFollowers}, ${today})
                    ON CONFLICT (metric_source, metric_name, snapshot_date)
                    DO UPDATE SET metric_value = ${newFollowers}, created_at = NOW()
                `;

                await sql`
                    INSERT INTO marketing_daily_snapshots (metric_source, metric_name, metric_value, snapshot_date)
                    VALUES ('instagram', 'unfollows_24h', ${unfollows}, ${today})
                    ON CONFLICT (metric_source, metric_name, snapshot_date)
                    DO UPDATE SET metric_value = ${unfollows}, created_at = NOW()
                `;

                results.instagram = {
                    totalFollowers: profile.followers_count,
                    newFollowers,
                    unfollows,
                };
            }
        } catch (err) {
            console.error('[Cron] Instagram snapshot error:', err.message);
            results.instagram = { error: err.message };
        }
    }

    return NextResponse.json({ ok: true, date: today, results });
}
