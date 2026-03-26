import { NextResponse } from 'next/server';
import { listCustomers, createCustomer } from '@/lib/notion';
import { writeLog } from '@/lib/admin-log';

/** GET /api/admin/customers?status=&source=&cursor=&pageSize= */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const result = await listCustomers({
            status: searchParams.get('status') || undefined,
            source: searchParams.get('source') || undefined,
            startCursor: searchParams.get('cursor') || undefined,
            pageSize: parseInt(searchParams.get('pageSize')) || 20,
        });
        return NextResponse.json(result);
    } catch (err) {
        console.error('List customers error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** POST /api/admin/customers { name, dogName, phone, email, lineId, address, source, notes } */
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.name?.trim()) {
            return NextResponse.json({ error: '客戶姓名為必填' }, { status: 400 });
        }
        const result = await createCustomer(body);
        try {
            await writeLog({
                action: 'create',
                entityType: 'customer',
                entityId: result.customer?.id || 'unknown',
                entityName: body.name,
                notes: body.notes,
            });
        } catch (logErr) {
            console.error('Failed to write log (non-blocking):', logErr.message);
        }
        return NextResponse.json(result, { status: result.created ? 201 : 200 });
    } catch (err) {
        console.error('Create customer error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
