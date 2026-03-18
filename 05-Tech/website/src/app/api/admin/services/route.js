import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const services = await sql`SELECT * FROM services ORDER BY sort_order`;
    return NextResponse.json(services);
}

export async function POST(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id, name, description, price, duration, landing_content, image_url, is_active, sort_order } = await request.json();

    if (!id || !name || price == null || !duration) {
        return NextResponse.json({ error: 'Missing required fields (id, name, price, duration)' }, { status: 400 });
    }

    const rows = await sql`
        INSERT INTO services (id, name, description, price, duration, landing_content, image_url, is_active, sort_order)
        VALUES (${id}, ${name}, ${description || null}, ${price}, ${duration}, ${landing_content || null}, ${image_url || null}, ${is_active !== false}, ${sort_order || 0})
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}
