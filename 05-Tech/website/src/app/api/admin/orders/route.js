import { NextResponse } from 'next/server';
import { listOrders, searchOrders, createOrder, resolveOrderRelations } from '@/lib/notion';
import { writeLog } from '@/lib/admin-log';

/** GET /api/admin/orders?status=&paymentStatus=&trainer=&cursor=&pageSize= */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();

        // If search query provided, use cross-entity fuzzy search
        if (search) {
            const orders = await searchOrders(search);
            const resolved = await resolveOrderRelations(orders);
            return NextResponse.json({ orders: resolved, hasMore: false, nextCursor: null });
        }

        const result = await listOrders({
            status: searchParams.get('status') || undefined,
            paymentStatus: searchParams.get('paymentStatus') || undefined,
            trainer: searchParams.get('trainer') || undefined,
            service: searchParams.get('service') || undefined,
            startCursor: searchParams.get('cursor') || undefined,
            pageSize: parseInt(searchParams.get('pageSize')) || 20,
        });
        result.orders = await resolveOrderRelations(result.orders);
        return NextResponse.json(result);
    } catch (err) {
        console.error('List orders error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** POST /api/admin/orders { customerId, serviceId, trainer, sessions, unitPrice, notes } */
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.customerId) {
            return NextResponse.json({ error: '客戶為必填' }, { status: 400 });
        }
        if (!body.serviceId) {
            return NextResponse.json({ error: '服務項目為必填' }, { status: 400 });
        }
        if (!body.sessions || !body.unitPrice) {
            return NextResponse.json({ error: '課堂數和單價為必填' }, { status: 400 });
        }
        const order = await createOrder(body);
        try {
            await writeLog({
                action: 'create',
                entityType: 'order',
                entityId: order.id || 'unknown',
                entityName: order.orderNumber,
                notes: body.notes,
            });
        } catch (logErr) {
            console.error('Failed to write log (non-blocking):', logErr.message);
        }
        return NextResponse.json(order, { status: 201 });
    } catch (err) {
        console.error('Create order error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
