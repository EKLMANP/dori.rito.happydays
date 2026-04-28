import { NextResponse } from 'next/server';
import { countCustomersByStatus } from '@/lib/notion';

/** GET /api/admin/customers/counts — totals grouped by 轉換狀態 (60s cache) */
export async function GET() {
    try {
        const data = await countCustomersByStatus();
        return NextResponse.json(data);
    } catch (err) {
        console.error('Count customers error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
