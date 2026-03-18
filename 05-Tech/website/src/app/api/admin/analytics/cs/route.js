import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { cached } from '@/lib/cache';

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
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;

    if (!apiKey || !dbId) {
        return {
            totalCustomers: 0,
            statusBreakdown: [],
            serviceBreakdown: [],
            recentCustomers: [],
            error: 'Notion not configured',
        };
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
    const customers = [];

    for (const page of allPages) {
        const props = page.properties;

        // Extract name
        const nameArr = props['客戶姓名']?.title;
        const name = nameArr?.map((t) => t.plain_text).join('') || '未知';

        // Extract email
        const email = props['聯絡Email']?.email || '';

        // Extract status
        const status = props['付款狀態']?.status?.name || '未知';
        statusMap[status] = (statusMap[status] || 0) + 1;

        // Extract services
        const services = props['付費服務類別']?.multi_select || [];
        for (const svc of services) {
            serviceMap[svc.name] = (serviceMap[svc.name] || 0) + 1;
        }

        // Collect for list (most recent first by created_time)
        customers.push({
            name,
            email,
            status,
            services: services.map((s) => s.name).join(', ') || '—',
            createdAt: page.created_time,
        });
    }

    // Sort by created date desc
    customers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
    };
}
