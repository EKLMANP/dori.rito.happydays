/**
 * One-time migration: restructure 訂單管理 Order DB 訂單狀態 options.
 *
 * Changes:
 *   - Adds new status options: 待排課, 已排課, 上課中, 完課
 *   - Updates all existing pages with 訂單狀態=已確認 → 待排課
 *
 * Run: node scripts/migrate-notion-order-status.js
 */

// Load env manually (no dotenv dependency)
import { readFileSync } from 'fs';
try {
    readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
} catch { /* file may not exist */ }

const NOTION_API_KEY = process.env.NOTION_API_KEY_CRM || process.env.NOTION_API_KEY;
const ORDER_DB_ID = process.env.NOTION_ORDER_DB_ID;

if (!NOTION_API_KEY || !ORDER_DB_ID) {
    console.error('Missing NOTION_API_KEY / NOTION_ORDER_DB_ID in .env.local');
    process.exit(1);
}

async function notionFetch(path, opts = {}) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
        method: opts.method || 'GET',
        headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion API ${path} → ${res.status}: ${text}`);
    }
    return res.json();
}

async function addStatusOptions() {
    console.log('Step 1: Adding new 訂單狀態 options to Order DB…');

    const db = await notionFetch(`/databases/${ORDER_DB_ID}`);
    const prop = db.properties['訂單狀態'];
    if (!prop) {
        console.error('訂單狀態 property not found in Order DB');
        process.exit(1);
    }

    const existingOptions = prop.status?.options || [];
    const existingNames = new Set(existingOptions.map(o => o.name));
    const newOptions = ['待排課', '已排課', '上課中', '完課'];

    const toAdd = newOptions.filter(n => !existingNames.has(n));
    if (toAdd.length === 0) {
        console.log('  All new options already exist, skipping.');
        return;
    }

    // Notion doesn't expose a direct "add option" endpoint for status properties.
    // Setting a page's status to a new value auto-creates the option.
    // We'll handle this implicitly when updating pages below.
    console.log(`  Will add options via page updates: ${toAdd.join(', ')}`);
}

async function migrateConfirmedPages() {
    console.log('\nStep 2: Finding pages with 訂單狀態=已確認…');

    let hasMore = true;
    let cursor = undefined;
    let updated = 0;
    let skipped = 0;

    while (hasMore) {
        const body = {
            filter: { property: '訂單狀態', status: { equals: '已確認' } },
            page_size: 100,
        };
        if (cursor) body.start_cursor = cursor;

        const data = await notionFetch(`/databases/${ORDER_DB_ID}/query`, {
            method: 'POST',
            body,
        });

        for (const page of data.results) {
            try {
                await notionFetch(`/pages/${page.id}`, {
                    method: 'PATCH',
                    body: { properties: { '訂單狀態': { status: { name: '待排課' } } } },
                });
                updated++;
                const title = page.properties['訂單編號']?.title?.[0]?.text?.content || page.id;
                console.log(`  ✓ ${title}: 已確認 → 待排課`);
            } catch (err) {
                skipped++;
                console.warn(`  ✗ ${page.id}: ${err.message}`);
            }
        }

        hasMore = data.has_more;
        cursor = data.next_cursor;
    }

    console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

async function main() {
    console.log('=== Notion Order Status Migration ===\n');
    await addStatusOptions();
    await migrateConfirmedPages();
    console.log('\n✅ Migration complete.');
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
