import { NextResponse } from 'next/server';
import { resetCustomerConversion } from '@/lib/notion';
import { writeLog } from '@/lib/admin-log';

/** POST /api/admin/customers/[id]/reset-conversion — clear manual override and re-derive. */
export async function POST(_request, { params }) {
    try {
        const { id } = await params;
        const customer = await resetCustomerConversion(id);
        await writeLog({
            action: 'update',
            entityType: 'customer',
            entityId: id,
            entityName: customer.name,
            notes: `重設為自動推導：${customer.conversionStatus}`,
        }).catch((err) => console.warn('writeLog failed (non-blocking):', err.message));
        return NextResponse.json(customer);
    } catch (err) {
        console.error('Reset conversion error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
