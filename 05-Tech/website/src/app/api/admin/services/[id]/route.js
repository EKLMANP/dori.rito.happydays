import { NextResponse } from 'next/server';
import { getService, updateService } from '@/lib/notion';

/** GET /api/admin/services/[id] */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const service = await getService(id);
        return NextResponse.json(service);
    } catch (err) {
        console.error('Get service error:', err);
        if (err.code === 'object_not_found') {
            return NextResponse.json({ error: '找不到服務' }, { status: 404 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** PATCH /api/admin/services/[id] { ...updates } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const updates = await request.json();
        const service = await updateService(id, updates);
        return NextResponse.json(service);
    } catch (err) {
        console.error('Update service error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
