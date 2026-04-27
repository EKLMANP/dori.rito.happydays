import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const [tableCounts, serviceChecks] = await Promise.all([
            // DB table row counts
            sql`
                SELECT 'processed_orders' as table_name, COUNT(*)::int as count FROM processed_orders
                UNION ALL
                SELECT 'slot_rules', COUNT(*)::int FROM slot_rules
                UNION ALL
                SELECT 'blocked_dates', COUNT(*)::int FROM blocked_dates
                UNION ALL
                SELECT 'services', COUNT(*)::int FROM services
            `,
            // Health checks with response times
            checkAllServices(),
        ]);

        const ENV_VARS = [
            { key: 'DATABASE_URL', label: 'Neon DB' },
            { key: 'NOTION_API_KEY_CRM', label: 'Notion API Key', alt: 'NOTION_API_KEY' },
            { key: 'NOTION_CUSTOMER_DB_ID', label: 'Notion Customer DB' },
            { key: 'NOTION_ORDER_DB_ID', label: 'Notion Order DB' },
            { key: 'ECPAY_MERCHANT_ID', label: 'ECPay Merchant ID' },
            { key: 'ECPAY_HASH_KEY', label: 'ECPay Hash Key' },
            { key: 'TELEGRAM_DR_FNACC_BOT_TOKEN', label: 'Telegram Bot Token' },
            { key: 'LINE_CHANNEL_ACCESS_TOKEN', label: 'LINE Channel Token' },
            { key: 'IG_ACCESS_TOKEN', label: 'Instagram Token' },
            { key: 'GHOST_URL', label: 'Ghost URL' },
            { key: 'GHOST_ADMIN_API_KEY', label: 'Ghost Admin API Key' },
            { key: 'MAILGUN_API_KEY', label: 'Mailgun API Key' },
            { key: 'GOOGLE_CALENDAR_ID', label: 'Google Calendar ID' },
        ];

        const envCheck = ENV_VARS.map(({ key, label, alt }) => ({
            key,
            label,
            present: !!process.env[key] || (alt ? !!process.env[alt] : false),
        }));

        return NextResponse.json({
            database: {
                tables: tableCounts.map((r) => ({
                    name: r.table_name,
                    rows: r.count,
                })),
                status: 'connected',
            },
            services: serviceChecks,
            envCheck,
            lastChecked: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[Analytics Tech] Error:', err);
        return NextResponse.json({ error: 'Failed to load tech data' }, { status: 500 });
    }
}

/** Check all integrated services with response times */
async function checkAllServices() {
    const checks = [
        { key: 'db', label: '資料庫 (Neon)', check: checkDB },
        { key: 'notion', label: 'Notion CRM', check: checkNotion },
        { key: 'ghost', label: 'Ghost CMS', check: checkGhost },
        { key: 'mailgun', label: 'Mailgun', check: checkMailgun },
        { key: 'ecpay', label: 'ECPay 金流', check: checkECPay },
        { key: 'telegram', label: 'Telegram Bot', check: checkTelegram },
        { key: 'line', label: 'LINE OA', check: checkLINE },
        { key: 'instagram', label: 'Instagram API', check: checkInstagram },
        { key: 'gcal', label: 'Google Calendar', check: checkGoogleCal },
    ];

    const results = await Promise.all(
        checks.map(async ({ key, label, check }) => {
            const start = Date.now();
            try {
                const ok = await check();
                return {
                    key,
                    label,
                    status: ok ? 'ok' : 'error',
                    responseMs: Date.now() - start,
                };
            } catch {
                return {
                    key,
                    label,
                    status: 'error',
                    responseMs: Date.now() - start,
                };
            }
        })
    );

    return results;
}

async function checkDB() {
    await sql`SELECT 1`;
    return true;
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
    const contentKey = process.env.GHOST_CONTENT_API_KEY;
    if (!url || !contentKey) return false;
    const res = await fetch(`${url}/ghost/api/content/settings/?key=${contentKey}`, {
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

async function checkECPay() {
    return !!(process.env.ECPAY_MERCHANT_ID && process.env.ECPAY_HASH_KEY && process.env.ECPAY_HASH_IV);
}

async function checkTelegram() {
    const token = process.env.TELEGRAM_DR_FNACC_BOT_TOKEN;
    if (!token) return false;
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: AbortSignal.timeout(5000),
    });
    return res.ok;
}

async function checkLINE() {
    return !!(process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN);
}

async function checkInstagram() {
    return !!(process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID);
}

async function checkGoogleCal() {
    return !!(process.env.GOOGLE_CALENDAR_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}
