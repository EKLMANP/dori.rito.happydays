import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// POST: Create a new form field
export async function POST(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { section_id, field_type, label, description, placeholder, options, is_required, sort_order } = await request.json();

    if (!section_id || !field_type || !label) {
        return NextResponse.json({ error: 'Missing required fields (section_id, field_type, label)' }, { status: 400 });
    }

    const validTypes = ['text', 'textarea', 'radio', 'checkbox', 'email', 'select'];
    if (!validTypes.includes(field_type)) {
        return NextResponse.json({ error: `Invalid field_type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const rows = await sql`
        INSERT INTO form_fields (section_id, field_type, label, description, placeholder, options, is_required, sort_order)
        VALUES (${section_id}, ${field_type}, ${label}, ${description || null}, ${placeholder || null}, ${options ? JSON.stringify(options) : null}, ${is_required !== false}, ${sort_order || 0})
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}

// PUT: Update a form field
export async function PUT(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, field_type, label, description, placeholder, options, is_required, sort_order, is_active } = body;

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const rows = await sql`
        UPDATE form_fields SET
            field_type = COALESCE(${field_type}, field_type),
            label = COALESCE(${label}, label),
            description = COALESCE(${description}, description),
            placeholder = COALESCE(${placeholder}, placeholder),
            options = COALESCE(${options ? JSON.stringify(options) : null}, options),
            is_required = COALESCE(${is_required}, is_required),
            sort_order = COALESCE(${sort_order}, sort_order),
            is_active = COALESCE(${is_active}, is_active),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
    `;

    if (!rows.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
}

// DELETE: Delete a form field
export async function DELETE(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await sql`DELETE FROM form_fields WHERE id = ${id}`;
    return NextResponse.json({ success: true });
}
