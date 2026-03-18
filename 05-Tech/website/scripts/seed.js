/**
 * Seed Script — Initial data for booking system
 *
 * Usage:
 *   DATABASE_URL=<neon-connection-string> node scripts/seed.js
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seed() {
    console.log('🌱 Seeding data...\n');

    // ==============================
    // 1. Service: 一對一線上諮詢
    // ==============================
    await sql`
        INSERT INTO services (id, name, description, price, duration, is_active, sort_order)
        VALUES (
            'online-consult',
            '一對一線上諮詢',
            '30 分鐘線上諮詢，由專業訓犬師為你的狗狗狀況提供解決方案，並制定後續課程大綱。',
            500,
            30,
            true,
            1
        )
        ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Service: online-consult');

    // ==============================
    // 2. Slot Rules
    // ==============================
    await sql`
        INSERT INTO slot_rules (service_id, available_days, start_hour, end_hour, slot_duration, buffer_minutes, advance_min_hours, advance_max_days)
        SELECT 'online-consult', ARRAY[1,2,3,4,5,6], 10, 18, 30, 15, 24, 30
        WHERE NOT EXISTS (SELECT 1 FROM slot_rules WHERE service_id = 'online-consult')
    `;
    console.log('✅ Slot rules');

    // ==============================
    // 3. Form Sections + Fields (24 fields from Tally form)
    // ==============================

    // Helper: insert section, return id
    async function insertSection(serviceId, title, description, sortOrder) {
        const rows = await sql`
            INSERT INTO form_sections (service_id, title, description, sort_order)
            VALUES (${serviceId}, ${title}, ${description}, ${sortOrder})
            RETURNING id
        `;
        return rows[0].id;
    }

    // Helper: insert field
    async function insertField(sectionId, fieldType, label, opts = {}) {
        const { description = null, placeholder = null, options = null, isRequired = true, sortOrder = 0 } = opts;
        await sql`
            INSERT INTO form_fields (section_id, field_type, label, description, placeholder, options, is_required, sort_order)
            VALUES (${sectionId}, ${fieldType}, ${label}, ${description}, ${placeholder}, ${options ? JSON.stringify(options) : null}, ${isRequired}, ${sortOrder})
        `;
    }

    // Check if already seeded
    const existing = await sql`SELECT COUNT(*) as count FROM form_sections WHERE service_id = 'online-consult'`;
    if (parseInt(existing[0].count) > 0) {
        console.log('⏭️  Form sections already seeded, skipping');
    } else {
        // --- Section 1: 基本資料 ---
        const s1 = await insertSection('online-consult', '基本資料', '請填寫你的基本資訊', 1);
        await insertField(s1, 'text', '怎麼稱呼你', { placeholder: '你的名字或暱稱', sortOrder: 1 });
        await insertField(s1, 'text', 'IG 名稱', { placeholder: '你的 Instagram 帳號', sortOrder: 2 });

        // --- Section 2: 狗狗資訊 ---
        const s2 = await insertSection('online-consult', '狗狗資訊', '告訴我們你的毛孩', 2);
        await insertField(s2, 'text', '狗狗名字', { placeholder: '你的狗狗叫什麼名字？', sortOrder: 1 });
        await insertField(s2, 'text', '品種 & 年齡', { placeholder: '例如：柴犬、3 歲', sortOrder: 2 });
        await insertField(s2, 'radio', '性別', {
            options: [{ value: 'male', label: '男生' }, { value: 'female', label: '女生' }],
            sortOrder: 3,
        });
        await insertField(s2, 'radio', '是否已結紮', {
            options: [{ value: 'yes', label: '是' }, { value: 'no', label: '否' }],
            sortOrder: 4,
        });
        await insertField(s2, 'textarea', '來家裡報到的時間 & 來源', {
            placeholder: '什麼時候加入你的家庭？從哪裡來的？（收容所、繁殖場、朋友等）',
            sortOrder: 5,
        });
        await insertField(s2, 'text', '主要照顧者', { placeholder: '誰是主要照顧狗狗的人？', sortOrder: 6 });

        // --- Section 3: 日常生活 ---
        const s3 = await insertSection('online-consult', '日常生活', '了解狗狗的日常作息', 3);
        await insertField(s3, 'text', '一天散步幾次 / 多久', { placeholder: '例如：一天 2 次，每次 30 分鐘', sortOrder: 1 });
        await insertField(s3, 'text', '散步地點', { placeholder: '通常在哪裡散步？', sortOrder: 2 });
        await insertField(s3, 'text', '家裡活動空間', { placeholder: '描述狗狗在家裡的活動空間', sortOrder: 3 });

        // --- Section 4: 行為問題 ---
        const s4 = await insertSection('online-consult', '行為問題', '這是最重要的部分，請盡量詳細描述', 4);
        await insertField(s4, 'textarea', '最希望解決的問題', {
            placeholder: '請描述你最希望改善的狗狗行為問題',
            sortOrder: 1,
        });
        await insertField(s4, 'textarea', '嘗試過的方法', {
            placeholder: '你目前嘗試過哪些方式來解決這個問題？',
            sortOrder: 2,
        });
        await insertField(s4, 'text', '是否找過訓犬師', {
            placeholder: '之前有找過其他訓犬師嗎？效果如何？',
            sortOrder: 3,
        });
        await insertField(s4, 'textarea', '咬人 / 咬狗紀錄', {
            placeholder: '狗狗是否有咬人或咬狗的紀錄？請描述情況',
            sortOrder: 4,
        });
        await insertField(s4, 'textarea', '壓力最大的情境', {
            placeholder: '什麼情境讓你的狗狗壓力最大？',
            sortOrder: 5,
        });
        await insertField(s4, 'textarea', '情境中的表現', {
            placeholder: '在那個情境中，狗狗會有什麼行為反應？',
            sortOrder: 6,
        });
        await insertField(s4, 'textarea', '期望改變 / 進步', {
            placeholder: '你希望狗狗能有什麼樣的改變？',
            sortOrder: 7,
        });
        await insertField(s4, 'textarea', '訓練上最大困難', {
            placeholder: '你在訓練狗狗時遇到的最大困難是什麼？',
            sortOrder: 8,
        });

        // --- Section 5: 健康狀況 ---
        const s5 = await insertSection('online-consult', '健康狀況', '了解狗狗的身體狀況', 5);
        await insertField(s5, 'checkbox', '身體狀況', {
            description: '請勾選狗狗目前或曾經有的身體狀況',
            options: [
                { value: 'arthritis', label: '關節炎' },
                { value: 'ear-infection', label: '耳炎' },
                { value: 'vision-loss', label: '視力退化' },
                { value: 'hearing-loss', label: '聽力退化' },
                { value: 'pancreatitis', label: '胰臟炎' },
                { value: 'skin-allergy', label: '過敏性皮膚炎' },
                { value: 'none', label: '皆無' },
            ],
            sortOrder: 1,
        });

        // --- Section 6: 補充 & 聯絡 ---
        const s6 = await insertSection('online-consult', '補充 & 聯絡方式', '最後的補充資訊', 6);
        await insertField(s6, 'textarea', '其他想分享的', {
            placeholder: '有沒有其他想讓我們知道的事情？',
            isRequired: false,
            sortOrder: 1,
        });
        await insertField(s6, 'email', '聯絡 Email', { placeholder: 'your@email.com', sortOrder: 2 });
        await insertField(s6, 'text', '聯絡手機', { placeholder: '0912-345-678', sortOrder: 3 });
        await insertField(s6, 'text', '地址', { placeholder: '上課地址（如需到府服務）', sortOrder: 4 });

        console.log('✅ Form sections + 24 fields');
    }

    // ==============================
    // 4. Email Templates (placeholder)
    // ==============================
    await sql`
        INSERT INTO email_templates (id, subject, body_html)
        VALUES (
            'booking-confirmation',
            '預約確認 — Dori & Rito 專業訓犬服務',
            '<h1>Hi {{customer_name}}，你的預約已確認！</h1><p>服務：{{service_name}}</p><p>時間：{{slot_date}} {{slot_time}}</p><p>Google Meet 連結：{{meet_link}}</p><p>如有任何問題，歡迎回信聯繫我們。</p><p>Dori & Rito Happydays 團隊</p>'
        )
        ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Email template: booking-confirmation');

    console.log('\n🎉 Seed complete.');
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
