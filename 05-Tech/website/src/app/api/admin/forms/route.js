import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET: List all form sections with fields for a service
export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id') || 'online-consult';

    const sections = await sql`
        SELECT * FROM form_sections
        WHERE service_id = ${serviceId}
        ORDER BY sort_order
    `;

    // Fetch fields for each section
    const sectionIds = sections.map((s) => s.id);
    let fields = [];
    if (sectionIds.length > 0) {
        fields = await sql`
            SELECT * FROM form_fields
            WHERE section_id = ANY(${sectionIds})
            ORDER BY sort_order
        `;
    }

    // Group fields by section
    const result = sections.map((section) => ({
        ...section,
        fields: fields.filter((f) => f.section_id === section.id),
    }));

    return NextResponse.json(result);
}

// POST: Create a new form section
export async function POST(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { service_id, title, description, sort_order } = await request.json();

    if (!service_id || !title) {
        return NextResponse.json({ error: 'Missing service_id or title' }, { status: 400 });
    }

    const rows = await sql`
        INSERT INTO form_sections (service_id, title, description, sort_order)
        VALUES (${service_id}, ${title}, ${description || null}, ${sort_order || 0})
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}

// PUT: Update a form section
export async function PUT(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id, title, description, sort_order, is_active } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const rows = await sql`
        UPDATE form_sections SET
            title = COALESCE(${title}, title),
            description = COALESCE(${description}, description),
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

// DELETE: Delete a form section (cascades to fields)
export async function DELETE(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await sql`DELETE FROM form_sections WHERE id = ${id}`;
    return NextResponse.json({ success: true });
}
