import { queryLogs } from '@/lib/admin-log';

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const filters = {
            action: url.searchParams.get('action') || undefined,
            entityType: url.searchParams.get('entityType') || undefined,
            entityId: url.searchParams.get('entityId') || undefined,
            startDate: url.searchParams.get('startDate') || undefined,
            endDate: url.searchParams.get('endDate') || undefined,
            limit: parseInt(url.searchParams.get('limit') || '50'),
            offset: parseInt(url.searchParams.get('offset') || '0'),
        };
        const result = await queryLogs(filters);
        return Response.json(result);
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
