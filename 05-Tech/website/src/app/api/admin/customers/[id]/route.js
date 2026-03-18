import { NextResponse } from 'next/server';
import { getCustomer, updateCustomer } from '@/lib/notion';

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

/** PATCH /api/admin/customers/[id] { ...updates } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const updates = await request.json();
        const customer = await updateCustomer(id, updates);
        return NextResponse.json(customer);
    } catch (err) {
        console.error('Update customer error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
