import { NextResponse } from 'next/server';
import { listServices, createService } from '@/lib/notion';

/** GET /api/admin/services?activeOnly=true */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';
        const services = await listServices({ activeOnly });
        return NextResponse.json({ services });
    } catch (err) {
        console.error('List services error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** POST /api/admin/services { name, code, type, defaultSessions, suggestedPrice, status, description } */
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.name?.trim()) {
            return NextResponse.json({ error: '服務名稱為必填' }, { status: 400 });
        }
        const service = await createService(body);
        return NextResponse.json(service, { status: 201 });
    } catch (err) {
        console.error('Create service error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
