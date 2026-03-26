import { NextResponse } from 'next/server';
import { getCustomer, updateCustomer, archiveCustomer } from '@/lib/notion';
import { writeLog, computeChanges } from '@/lib/admin-log';

/** GET /api/admin/customers/[id] */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const customer = await getCustomer(id);
        return NextResponse.json(customer);
    } catch (err) {
        console.error('Get customer error:', err);
        if (err.code === 'object_not_found') {
            return NextResponse.json({ error: '找不到客戶' }, { status: 404 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** PATCH /api/admin/customers/[id] { ...updates, notes } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { notes, ...updates } = await request.json();
        const before = await getCustomer(id);
        const customer = await updateCustomer(id, updates);
        const changes = computeChanges(before, customer, Object.keys(updates));
        await writeLog({
            action: 'update',
            entityType: 'customer',
            entityId: id,
            entityName: customer.name,
            changes,
            notes,
        });
        return NextResponse.json(customer);
    } catch (err) {
        console.error('Update customer error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/admin/customers/[id] */
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const customer = await getCustomer(id);
        await archiveCustomer(id);
        await writeLog({
            action: 'archive',
            entityType: 'customer',
            entityId: id,
            entityName: customer.name,
            notes: body.notes,
        });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
