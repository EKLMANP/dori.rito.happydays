import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/notion';

/** GET /api/admin/dashboard */
export async function GET() {
    try {
        const stats = await getDashboardStats();
        return NextResponse.json(stats);
    } catch (err) {
        console.error('Dashboard stats error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
