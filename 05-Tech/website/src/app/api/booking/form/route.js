import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SEED_FORM_SECTIONS } from '@/lib/seed-data';

// GET: Public — get form schema for a service
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id') || 'online-consult';
    const locale = searchParams.get('locale') === 'en' ? 'en' : 'zh-TW';
    const isEn = locale === 'en';

    try {
        const sections = await sql`
            SELECT * FROM form_sections
            WHERE service_id = ${serviceId} AND is_active = true
            ORDER BY sort_order
        `;

        if (sections.length === 0) {
            return NextResponse.json(
                SEED_FORM_SECTIONS.filter(s => s.service_id === serviceId)
            );
        }

        const sectionIds = sections.map((s) => s.id);
        const fields = await sql`
            SELECT * FROM form_fields
            WHERE section_id = ANY(${sectionIds}) AND is_active = true
            ORDER BY sort_order
        `;

        const result = sections.map((section) => {
            const sectionTitle = isEn && section.en_title ? section.en_title : section.title;
            const sectionDesc = isEn && section.en_description ? section.en_description : section.description;

            return {
                id: section.id,
                title: sectionTitle,
                description: sectionDesc,
                // _notion_title preserved for Notion block heading (always Chinese)
                ...(isEn && section.en_title ? { _notion_title: section.title } : {}),
                fields: fields
                    .filter((f) => f.section_id === section.id)
                    .map((f) => {
                        const label = isEn && f.en_label ? f.en_label : f.label;
                        const description = isEn && f.en_description ? f.en_description : f.description;
                        const placeholder = isEn && f.en_placeholder ? f.en_placeholder : f.placeholder;
                        const options = isEn && f.en_options ? f.en_options : f.options;

                        return {
                            id: f.id,
                            field_type: f.field_type,
                            label,
                            description,
                            placeholder,
                            options,
                            is_required: f.is_required,
                            // _notion_* preserved for Notion property matching (always Chinese)
                            ...(isEn && f.en_label ? { _notion_label: f.label } : {}),
                            ...(isEn && f.en_options ? { _notion_options: f.options } : {}),
                        };
                    }),
            };
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error('[form API] DB query failed, using fallback:', err.message);
        return NextResponse.json(
            SEED_FORM_SECTIONS.filter(s => s.service_id === serviceId)
        );
    }
}
