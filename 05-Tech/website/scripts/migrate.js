/**
 * Database Migration Script
 * Creates all tables for the booking system.
 *
 * Usage:
 *   DATABASE_URL=<neon-connection-string> node scripts/migrate.js
 *
 * Or with .env.local loaded:
 *   npx dotenv -e .env.local -- node scripts/migrate.js
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
    console.log('🚀 Starting migration...\n');

    // 1. Services
    await sql`
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            landing_content TEXT,
            image_url TEXT,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ services');

    // 2. Slot Rules
    await sql`
        CREATE TABLE IF NOT EXISTS slot_rules (
            id SERIAL PRIMARY KEY,
            service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
            available_days INTEGER[] NOT NULL,
            start_hour INTEGER DEFAULT 10,
            end_hour INTEGER DEFAULT 18,
            slot_duration INTEGER NOT NULL,
            buffer_minutes INTEGER DEFAULT 15,
            advance_min_hours INTEGER DEFAULT 24,
            advance_max_days INTEGER DEFAULT 30,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ slot_rules');

    // 3. Blocked Dates
    await sql`
        CREATE TABLE IF NOT EXISTS blocked_dates (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ blocked_dates');

    // 4. Form Sections
    await sql`
        CREATE TABLE IF NOT EXISTS form_sections (
            id SERIAL PRIMARY KEY,
            service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ form_sections');

    // 5. Form Fields (Dynamic Form Engine)
    await sql`
        CREATE TABLE IF NOT EXISTS form_fields (
            id SERIAL PRIMARY KEY,
            section_id INTEGER REFERENCES form_sections(id) ON DELETE CASCADE,
            field_type TEXT NOT NULL,
            label TEXT NOT NULL,
            description TEXT,
            placeholder TEXT,
            options JSONB,
            is_required BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ form_fields');

    // 6. Email Templates
    await sql`
        CREATE TABLE IF NOT EXISTS email_templates (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            header_image_url TEXT,
            header_image_width INTEGER DEFAULT 600,
            body_html TEXT NOT NULL,
            footer_html TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ email_templates');

    // 7. Processed Orders (webhook idempotency)
    await sql`
        CREATE TABLE IF NOT EXISTS processed_orders (
            merchant_trade_no TEXT PRIMARY KEY,
            booking_data JSONB,
            processed_at TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('✅ processed_orders');

    console.log('\n🎉 Migration complete — all 7 tables created.');
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
