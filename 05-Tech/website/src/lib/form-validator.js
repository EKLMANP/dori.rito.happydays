/**
 * Dynamic Form Backend Validator
 *
 * Validates form submissions against the DB-defined schema.
 * Prevents bypassing client-side validation.
 */

import { sql } from '@/lib/db';

/**
 * Validate form responses against the DB schema for a service.
 *
 * @param {string} serviceId - Service ID
 * @param {object} responses - { [fieldId]: value }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export async function validateFormResponses(serviceId, responses) {
    const errors = [];

    // Fetch active fields for this service
    const fields = await sql`
        SELECT ff.id, ff.field_type, ff.label, ff.is_required, ff.options
        FROM form_fields ff
        JOIN form_sections fs ON ff.section_id = fs.id
        WHERE fs.service_id = ${serviceId}
          AND fs.is_active = true
          AND ff.is_active = true
        ORDER BY fs.sort_order, ff.sort_order
    `;

    for (const field of fields) {
        const value = responses[String(field.id)];

        // Check required
        if (field.is_required) {
            if (value === undefined || value === null || value === '') {
                errors.push(`「${field.label}」為必填欄位`);
                continue;
            }
            // For checkbox arrays, must have at least one selection
            if (field.field_type === 'checkbox' && Array.isArray(value) && value.length === 0) {
                errors.push(`「${field.label}」請至少選擇一項`);
                continue;
            }
        }

        // Skip empty optional fields
        if (value === undefined || value === null || value === '') continue;

        // Type-specific validation
        switch (field.field_type) {
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.push(`「${field.label}」格式不正確`);
                }
                break;

            case 'radio':
            case 'select': {
                const options = field.options || [];
                const validValues = options.map(o => o.value);
                if (!validValues.includes(value)) {
                    errors.push(`「${field.label}」選項無效`);
                }
                break;
            }

            case 'checkbox': {
                if (!Array.isArray(value)) {
                    errors.push(`「${field.label}」格式錯誤`);
                    break;
                }
                const options = field.options || [];
                const validValues = options.map(o => o.value);
                for (const v of value) {
                    if (!validValues.includes(v)) {
                        errors.push(`「${field.label}」包含無效選項`);
                        break;
                    }
                }
                break;
            }

            case 'text':
            case 'textarea':
                if (typeof value !== 'string') {
                    errors.push(`「${field.label}」格式錯誤`);
                } else if (value.length > 5000) {
                    errors.push(`「${field.label}」文字過長 (上限 5000 字)`);
                }
                break;
        }
    }

    return { valid: errors.length === 0, errors };
}
