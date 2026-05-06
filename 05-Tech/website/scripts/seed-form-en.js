/**
 * PR5: Questionnaire English Translation Seed
 *
 * Step 1 — Run the migration first (idempotent):
 *   psql $DATABASE_URL -c "$(node -e "require('./scripts/seed-form-en.js').migration()")"
 *
 * Step 2 — Run this script to populate English translations:
 *   node scripts/seed-form-en.js
 *
 * The script matches form_fields by their Chinese label (partial match)
 * and updates en_label, en_description, en_placeholder, en_options.
 * For form_sections it matches by title.
 *
 * Safe to run multiple times (uses UPDATE ... WHERE label ILIKE).
 */

import { sql } from '../src/lib/db.js';

// ---------------------------------------------------------------------------
// Migration DDL (run once, idempotent via IF NOT EXISTS)
// ---------------------------------------------------------------------------
export function migration() {
    return `
ALTER TABLE form_sections
    ADD COLUMN IF NOT EXISTS en_title TEXT,
    ADD COLUMN IF NOT EXISTS en_description TEXT;

ALTER TABLE form_fields
    ADD COLUMN IF NOT EXISTS en_label TEXT,
    ADD COLUMN IF NOT EXISTS en_description TEXT,
    ADD COLUMN IF NOT EXISTS en_placeholder TEXT,
    ADD COLUMN IF NOT EXISTS en_options JSONB;
    `;
}

// ---------------------------------------------------------------------------
// Section translations (match by title substring)
// ---------------------------------------------------------------------------
const SECTION_TRANSLATIONS = [
    {
        match: '關於你',
        en_title: 'About you',
        en_description: null,
    },
    {
        match: '關於你的狗',
        en_title: 'About your dog',
        en_description: null,
    },
    {
        match: '行為問題',
        en_title: 'Behaviour & training',
        en_description: null,
    },
    {
        match: '聯絡資訊',
        en_title: 'Contact details',
        en_description: null,
    },
];

// ---------------------------------------------------------------------------
// Field translations (match by label substring)
// ---------------------------------------------------------------------------
const FIELD_TRANSLATIONS = [
    {
        match: '怎麼稱呼你',
        en_label: 'What should we call you?',
        en_placeholder: 'Your name or nickname',
        en_description: null,
        en_options: null,
    },
    {
        match: 'IG 名稱',
        en_label: 'Instagram handle',
        en_placeholder: '@your_handle (optional)',
        en_description: null,
        en_options: null,
    },
    {
        match: '狗狗名字',
        en_label: "Your dog's name",
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '品種 & 年齡',
        en_label: 'Breed & age',
        en_placeholder: 'e.g. Golden Retriever, 2 years',
        en_description: null,
        en_options: null,
    },
    {
        match: '性別',
        en_label: 'Sex',
        en_placeholder: null,
        en_description: null,
        en_options: JSON.stringify([
            { value: '公', label: 'Male' },
            { value: '母', label: 'Female' },
        ]),
    },
    {
        match: '是否已結紮',
        en_label: 'Spayed / Neutered?',
        en_placeholder: null,
        en_description: null,
        en_options: JSON.stringify([
            { value: '是', label: 'Yes' },
            { value: '否', label: 'No' },
        ]),
    },
    {
        match: '來家裡報到的時間',
        en_label: 'When did your dog join your family?',
        en_placeholder: 'e.g. March 2022, rescue',
        en_description: null,
        en_options: null,
    },
    {
        match: '主要照顧者',
        en_label: 'Who is the primary caregiver?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '一天散步幾次',
        en_label: 'How many walks per day, and for how long?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '散步地點',
        en_label: 'Where do you usually walk?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '家裡活動空間',
        en_label: 'How large is your living space?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '最希望解決的問題',
        en_label: 'What issues would you most like to resolve?',
        en_placeholder: null,
        en_description: 'You can list more than one.',
        en_options: null,
    },
    {
        match: '嘗試過的方法',
        en_label: "What have you already tried?",
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '是否找過訓犬師',
        en_label: 'Have you worked with a trainer before?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '咬人 / 咬狗紀錄',
        en_label: 'Has your dog ever bitten a person or another dog?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '壓力最大的情境',
        en_label: 'What situations stress you out the most, and why?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '情境中的表現',
        en_label: 'How does your dog typically react in those situations?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '期望改變 / 進步',
        en_label: 'What changes do you most hope to see?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '訓練上最大困難',
        en_label: 'What do you find most challenging about training your dog?',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '身體狀況',
        en_label: 'Current health conditions',
        en_placeholder: null,
        en_description: null,
        en_options: JSON.stringify([
            { value: '健康', label: 'Healthy' },
            { value: '有過敏', label: 'Allergies' },
            { value: '有心臟病', label: 'Heart condition' },
            { value: '有關節問題', label: 'Joint issues' },
            { value: '其他', label: 'Other' },
        ]),
    },
    {
        match: '其他想分享的',
        en_label: "Anything else you'd like to share?",
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '聯絡 Email',
        en_label: 'Contact email',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '聯絡手機',
        en_label: 'Phone number',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
    {
        match: '地址',
        en_label: 'Address',
        en_placeholder: null,
        en_description: null,
        en_options: null,
    },
];

async function runSeed() {
    console.log('Running form English translation seed...\n');
    console.log('(Migration assumed already run — skipping ALTER TABLE)\n');

    // Seed sections
    let sectionUpdated = 0;
    for (const t of SECTION_TRANSLATIONS) {
        const result = await sql`
            UPDATE form_sections
            SET
                en_title = ${t.en_title},
                en_description = ${t.en_description}
            WHERE title ILIKE ${'%' + t.match + '%'}
            RETURNING id
        `;
        sectionUpdated += result.length;
    }
    console.log(`✓ Sections: ${sectionUpdated} row(s) updated`);

    // Seed fields
    let fieldUpdated = 0;
    for (const t of FIELD_TRANSLATIONS) {
        const result = t.en_options
            ? await sql`
                UPDATE form_fields
                SET
                    en_label = ${t.en_label},
                    en_description = ${t.en_description},
                    en_placeholder = ${t.en_placeholder},
                    en_options = ${t.en_options}::jsonb
                WHERE label ILIKE ${'%' + t.match + '%'}
                RETURNING id
              `
            : await sql`
                UPDATE form_fields
                SET
                    en_label = ${t.en_label},
                    en_description = ${t.en_description},
                    en_placeholder = ${t.en_placeholder},
                    en_options = NULL
                WHERE label ILIKE ${'%' + t.match + '%'}
                RETURNING id
              `;
        fieldUpdated += result.length;
    }
    console.log(`✓ Fields: ${fieldUpdated} row(s) updated`);

    console.log('\nDone. Run /api/booking/form?service_id=single-session&locale=en to verify.');
    process.exit(0);
}

runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
