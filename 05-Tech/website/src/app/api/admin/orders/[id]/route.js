import { NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/notion';

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

/** PATCH /api/admin/orders/[id] { ...updates } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const updates = await request.json();
        const order = await updateOrder(id, updates);
        return NextResponse.json(order);
    } catch (err) {
        console.error('Update order error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
