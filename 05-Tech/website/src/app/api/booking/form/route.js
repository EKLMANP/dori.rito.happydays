import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET: Public — get form schema for a service
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id') || 'online-consult';

    const sections = await sql`
        SELECT * FROM form_sections
        WHERE service_id = ${serviceId} AND is_active = true
        ORDER BY sort_order
    `;

    const sectionIds = sections.map((s) => s.id);
    let fields = [];
    if (sectionIds.length > 0) {
        fields = await sql`
            SELECT * FROM form_fields
            WHERE section_id = ANY(${sectionIds}) AND is_active = true
            ORDER BY sort_order
        `;
    }

    const result = sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        fields: fields
            .filter((f) => f.section_id === section.id)
            .map((f) => ({
                id: f.id,
                field_type: f.field_type,
                label: f.label,
                description: f.description,
                placeholder: f.placeholder,
                options: f.options,
                is_required: f.is_required,
            })),
    }));

    return NextResponse.json(result);
}
