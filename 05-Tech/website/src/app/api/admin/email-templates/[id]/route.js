import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/admin/email-templates/:id — Get single template
export async function GET(request, { params }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const rows = await sql`SELECT * FROM email_templates WHERE id = ${id}`;

    if (rows.length === 0) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
}

// PUT /api/admin/email-templates/:id — Update template
export async function PUT(request, { params }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const rows = await sql`SELECT id FROM email_templates WHERE id = ${id}`;
    if (rows.length === 0) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await sql`
        UPDATE email_templates SET
            subject = COALESCE(${body.subject ?? null}, subject),
            header_image_url = ${body.header_image_url !== undefined ? body.header_image_url : null},
            header_image_width = COALESCE(${body.header_image_width ?? null}, header_image_width),
            body_html = COALESCE(${body.body_html ?? null}, body_html),
            footer_html = ${body.footer_html !== undefined ? body.footer_html : null},
            updated_at = NOW()
        WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
}

// DELETE /api/admin/email-templates/:id — Delete template
export async function DELETE(request, { params }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    await sql`DELETE FROM email_templates WHERE id = ${id}`;
    return NextResponse.json({ success: true });
}
