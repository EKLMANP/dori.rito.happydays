import { NextResponse } from 'next/server';
import { getOrder, updateOrder, archiveOrder } from '@/lib/notion';
import { writeLog, computeChanges } from '@/lib/admin-log';

/** GET /api/admin/orders/[id] */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const order = await getOrder(id);
        return NextResponse.json(order);
    } catch (err) {
        console.error('Get order error:', err);
        if (err.code === 'object_not_found') {
            return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** PATCH /api/admin/orders/[id] { ...updates, notes } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { notes, ...updates } = await request.json();
        const before = await getOrder(id);
        const order = await updateOrder(id, updates);
        const changes = computeChanges(before, order, Object.keys(updates));
        await writeLog({
            action: 'update',
            entityType: 'order',
            entityId: id,
            entityName: order.orderNumber,
            changes,
            notes,
        });
        return NextResponse.json(order);
    } catch (err) {
        console.error('Update order error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/admin/orders/[id] */
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const order = await getOrder(id);
        await archiveOrder(id);
        await writeLog({
            action: 'archive',
            entityType: 'order',
            entityId: id,
            entityName: order.orderNumber,
            notes: body.notes,
        });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
