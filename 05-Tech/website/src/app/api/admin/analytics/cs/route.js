import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { cached } from '@/lib/cache';
import { evaluateAlerts, CS_RULES } from '@/lib/alerts/index.js';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const CACHE_TTL = 5 * 60_000; // 5 minutes

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const data = await cached('notion-cs-analytics', CACHE_TTL, fetchNotionCustomerData);

        return NextResponse.json(data);
    } catch (err) {
        console.error('[Analytics CS] Error:', err);
        return NextResponse.json({ error: 'Failed to load customer success data' }, { status: 500 });
    }
}

/** Fetch and aggregate all customer data from Notion CRM */
async function fetchNotionCustomerData() {
    const apiKey = process.env.NOTION_API_KEY_CRM || process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;

    if (!apiKey || !dbId) {
        const missing = [];
        if (!apiKey) missing.push('NOTION_API_KEY_CRM');
        if (!dbId) missing.push('NOTION_CUSTOMER_DB_ID');
        return { error: 'ENV_MISSING', missing };
    }

    // Paginate through all customers
    const allPages = [];
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

        if (!res.ok) {
            const errText = await res.text();
            console.error('[CS Analytics] Notion query failed:', errText);
            break;
        }

        const data = await res.json();
        allPages.push(...data.results);
        cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    // Aggregate data
    const statusMap = {};
    const serviceMap = {};
    const journeyMap = {};
    const customers = [];
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    // Health score breakdown counters
    const healthBreakdown = { high: 0, medium: 0, low: 0 };
    const atRiskCustomers = [];

    let activeCustomers = 0;

    for (const page of allPages) {
        const props = page.properties;

        // Extract name
        const nameArr = props['客戶姓名']?.title;
        const name = nameArr?.map((t) => t.plain_text).join('') || '未知';

        // Extract email
        const email = props['聯絡Email']?.email || '';

        // Extract payment status
        const status = props['付款狀態']?.status?.name || '未知';
        statusMap[status] = (statusMap[status] || 0) + 1;

        // Extract journey/conversion status
        const journeyStatus = props['轉換狀態']?.status?.name || props['轉換狀態']?.select?.name || null;
        if (journeyStatus) {
            journeyMap[journeyStatus] = (journeyMap[journeyStatus] || 0) + 1;
        }

        // Extract services
        const services = props['付費服務類別']?.multi_select || [];
        for (const svc of services) {
            serviceMap[svc.name] = (serviceMap[svc.name] || 0) + 1;
        }

        // Compute health score
        const hasPaid = status !== '未知' && status !== '未付款' && status !== '';
        const hasServices = services.length > 0;
        const createdAt = page.created_time;
        const isRecent = createdAt && (now - new Date(createdAt).getTime()) < ninetyDaysMs;

        let healthScore = 0;
        if (hasPaid) healthScore += 40;
        if (hasServices) healthScore += 30;
        if (isRecent) healthScore += 30;

        if (healthScore >= 70) {
            healthBreakdown.high += 1;
        } else if (healthScore >= 40) {
            healthBreakdown.medium += 1;
        } else {
            healthBreakdown.low += 1;
        }

        // Active vs dormant: recent (90 days) OR paid
        if (isRecent || hasPaid) {
            activeCustomers += 1;
        }

        // Collect for list (most recent first by created_time)
        const customer = {
            name,
            email,
            status,
            services: services.map((s) => s.name).join(', ') || '—',
            createdAt,
            healthScore,
        };
        customers.push(customer);

        // At-risk customers (health score < 40), collect up to 10
        if (healthScore < 40 && atRiskCustomers.length < 10) {
            atRiskCustomers.push({
                name,
                status,
                services: customer.services,
                createdAt,
                healthScore,
            });
        }
    }

    // Sort by created date desc
    customers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const dormantCustomers = allPages.length - activeCustomers;

    // Journey breakdown
    const journeyBreakdown = Object.entries(journeyMap).map(([stage, count]) => ({ stage, count }));

    // CS alerts
    const alertMetrics = {
        churnRateChange: 0, // placeholder
        surveyFillRate: 100, // we don't have this yet
        hasLowRating: false, // placeholder
        repurchaseRate30d: 0, // placeholder
    };
    const alerts = evaluateAlerts(CS_RULES, alertMetrics);

    return {
        totalCustomers: allPages.length,
        statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({
            status,
            count,
        })),
        serviceBreakdown: Object.entries(serviceMap).map(([service, count]) => ({
            service,
            count,
        })),
        recentCustomers: customers.slice(0, 20),
        journeyBreakdown,
        healthBreakdown,
        atRiskCustomers,
        activeCustomers,
        dormantCustomers,
        alerts,
    };
}
