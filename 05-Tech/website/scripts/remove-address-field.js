/**
 * One-time migration: deactivate all address form fields
 *
 * Usage:
 *   npx dotenv -e .env.local -- node scripts/remove-address-field.js
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function run() {
    const result = await sql`
        UPDATE form_fields
        SET is_active = false
        WHERE label = '地址'
    `;
    console.log(`✅ Deactivated ${result.count ?? 'N/A'} address field(s)`);
}

run().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
