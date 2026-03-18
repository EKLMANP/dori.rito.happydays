import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request, { params }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const rows = await sql`SELECT * FROM services WHERE id = ${id}`;

    if (!rows.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
}

export async function PUT(request, { params }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, duration, landing_content, image_url, is_active, sort_order } = body;

    const rows = await sql`
        UPDATE services SET
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            price = COALESCE(${price}, price),
            duration = COALESCE(${duration}, duration),
            landing_content = COALESCE(${landing_content}, landing_content),
            image_url = COALESCE(${image_url}, image_url),
            is_active = COALESCE(${is_active}, is_active),
            sort_order = COALESCE(${sort_order}, sort_order),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
    `;

    if (!rows.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    await sql`DELETE FROM services WHERE id = ${id}`;
    return NextResponse.json({ success: true });
}
