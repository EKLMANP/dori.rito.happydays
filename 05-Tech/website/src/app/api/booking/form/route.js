import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SEED_FORM_SECTIONS } from '@/lib/seed-data';

// Applies locale overlay to sections (works for both DB rows and fallback seed data).
// Always strips en_* fields from the response to keep the API payload clean.
function applyLocale(sections, isEn) {
    return sections.map((section) => {
        const title = (isEn && section.en_title) ? section.en_title : section.title;
        const description = (isEn && section.en_description) ? section.en_description : section.description;
        return {
            ...section,
            title,
            description,
            ...(isEn && section.en_title ? { _notion_title: section.title } : {}),
            en_title: undefined,
            en_description: undefined,
            fields: (section.fields || []).map((f) => {
                const label = (isEn && f.en_label) ? f.en_label : f.label;
                const desc = (isEn && f.en_description) ? f.en_description : f.description;
                const placeholder = (isEn && f.en_placeholder) ? f.en_placeholder : f.placeholder;
                const options = (isEn && f.en_options) ? f.en_options : f.options;
                return {
                    ...f,
                    label,
                    description: desc,
                    placeholder,
                    options,
                    ...(isEn && f.en_label ? { _notion_label: f.label } : {}),
                    ...(isEn && f.en_options ? { _notion_options: f.options } : {}),
                    en_label: undefined,
                    en_description: undefined,
                    en_placeholder: undefined,
                    en_options: undefined,
                };
            }),
        };
    });
}

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
            const fallback = SEED_FORM_SECTIONS.filter(s => s.service_id === serviceId);
            return NextResponse.json(applyLocale(fallback, isEn));
        }

        const sectionIds = sections.map((s) => s.id);
        const fields = await sql`
            SELECT * FROM form_fields
            WHERE section_id = ANY(${sectionIds}) AND is_active = true
            ORDER BY sort_order
        `;

        const result = sections.map((section) => ({
            id: section.id,
            title: isEn && section.en_title ? section.en_title : section.title,
            description: isEn && section.en_description ? section.en_description : section.description,
            ...(isEn && section.en_title ? { _notion_title: section.title } : {}),
            fields: fields
                .filter((f) => f.section_id === section.id)
                .map((f) => ({
                    id: f.id,
                    field_type: f.field_type,
                    label: isEn && f.en_label ? f.en_label : f.label,
                    description: isEn && f.en_description ? f.en_description : f.description,
                    placeholder: isEn && f.en_placeholder ? f.en_placeholder : f.placeholder,
                    options: isEn && f.en_options ? f.en_options : f.options,
                    is_required: f.is_required,
                    ...(isEn && f.en_label ? { _notion_label: f.label } : {}),
                    ...(isEn && f.en_options ? { _notion_options: f.options } : {}),
                })),
        }));

        return NextResponse.json(result);
    } catch (err) {
        console.error('[form API] DB query failed, using fallback:', err.message);
        const fallback = SEED_FORM_SECTIONS.filter(s => s.service_id === serviceId);
        return NextResponse.json(applyLocale(fallback, isEn));
    }
}
