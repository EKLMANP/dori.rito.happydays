import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// PUT: Reorder sections or fields
// Body: { type: 'sections' | 'fields', items: [{ id, sort_order }] }
export async function PUT(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { type, items } = await request.json();

    if (!type || !items?.length) {
        return NextResponse.json({ error: 'Missing type or items' }, { status: 400 });
    }

    if (type === 'sections') {
        for (const item of items) {
            await sql`UPDATE form_sections SET sort_order = ${item.sort_order}, updated_at = NOW() WHERE id = ${item.id}`;
        }
    } else if (type === 'fields') {
        for (const item of items) {
            await sql`UPDATE form_fields SET sort_order = ${item.sort_order}, updated_at = NOW() WHERE id = ${item.id}`;
        }
    } else {
        return NextResponse.json({ error: 'type must be "sections" or "fields"' }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: items.length });
}
