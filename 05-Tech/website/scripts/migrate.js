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
            processed_at TIMESTAMP DEFAULT NOW(),
            automation_completed_at TIMESTAMP
        )
    `;
    console.log('✅ processed_orders');

    // Add automation_completed_at column if missing (idempotent for existing DBs)
    await sql`
        ALTER TABLE processed_orders
        ADD COLUMN IF NOT EXISTS automation_completed_at TIMESTAMP
    `;
    console.log('✅ processed_orders.automation_completed_at column ensured');

    // Phase 1 — payment lifecycle columns
    // payment_status: pending | in_progress | paid | failed | cancelled
    // order_status:   not_started | pending_schedule | scheduled | in_progress | done | cancelled | reselect_payment
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'not_started'`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS payment_method TEXT`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS payment_expire_at TIMESTAMPTZ`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS payment_paid_at TIMESTAMPTZ`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS superseded_by TEXT`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS notion_order_id TEXT`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS customer_email_override TEXT`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS notes TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_processed_orders_expire ON processed_orders (payment_expire_at) WHERE payment_status = 'in_progress'`;
    console.log('✅ processed_orders payment lifecycle columns ensured');

    // Phase 2 — multi-provider payment columns (ECPay + PayPal)
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'ecpay'`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TWD'`;
    await sql`ALTER TABLE processed_orders ADD COLUMN IF NOT EXISTS amount_charged INTEGER`;
    await sql`CREATE INDEX IF NOT EXISTS idx_processed_orders_paypal ON processed_orders (paypal_order_id) WHERE paypal_order_id IS NOT NULL`;
    console.log('✅ processed_orders multi-provider columns ensured');

    console.log('\n🎉 Migration complete — all 7 tables created.');
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
