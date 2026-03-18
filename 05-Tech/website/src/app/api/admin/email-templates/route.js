import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/admin/email-templates — List all templates
export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const rows = await sql`
        SELECT id, subject, header_image_url, header_image_width, updated_at
        FROM email_templates
        ORDER BY id
    `;
    return NextResponse.json(rows);
}

// POST /api/admin/email-templates — Create a new template
export async function POST(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id, subject, body_html, header_image_url, header_image_width, footer_html } =
        await request.json();

    if (!id || !subject || !body_html) {
        return NextResponse.json(
            { error: 'id, subject, and body_html are required' },
            { status: 400 }
        );
    }

    await sql`
        INSERT INTO email_templates (id, subject, body_html, header_image_url, header_image_width, footer_html)
        VALUES (${id}, ${subject}, ${body_html}, ${header_image_url || null}, ${header_image_width || 600}, ${footer_html || null})
    `;

    return NextResponse.json({ success: true, id }, { status: 201 });
}
