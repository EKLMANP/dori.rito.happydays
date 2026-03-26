import { NextResponse } from 'next/server';
import { getCachedDashboardStats } from '@/lib/notion';

/** GET /api/admin/dashboard (5-min cache) */
export async function GET() {
    try {
        const stats = await getCachedDashboardStats();
        return NextResponse.json(stats);
    } catch (err) {
        console.error('Dashboard stats error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
