#!/usr/bin/env node
/**
 * Notion DB Migration — Phase 1 Payment Lifecycle Fields
 * =======================================================
 * Idempotently ensures the Order DB and Customer DB have the columns required
 * for the new payment flow (重新選擇付款方式 / 付款中 / 付款失敗 / cron 過期取消).
 *
 * Usage:
 *   NOTION_API_KEY=secret_xxx \
 *   NOTION_ORDER_DB_ID=xxx \
 *   NOTION_CUSTOMER_DB_ID=xxx \
 *     node scripts/migrate-notion-payment-fields.js
 */

const { Client } = require('@notionhq/client');

const NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_QUOTATION_TOKEN;
const ORDER_DB_ID = process.env.NOTION_ORDER_DB_ID;
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_DB_ID || process.env.NOTION_CUSTOMER_DATABASE_ID;

if (!NOTION_API_KEY || !ORDER_DB_ID || !CUSTOMER_DB_ID) {
    console.error('Required: NOTION_API_KEY, NOTION_ORDER_DB_ID, NOTION_CUSTOMER_DB_ID');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const ORDER_NEW_PROPS = {
    付款方式: {
        select: {
            options: [
                { name: '未選擇', color: 'gray' },
                { name: '信用卡', color: 'blue' },
                { name: 'ATM', color: 'green' },
                { name: '超商代碼', color: 'orange' },
                { name: '超商條碼', color: 'purple' },
            ],
        },
    },
    付款截止日期: { date: {} },
    付款日期: { date: {} },
    付款Email寄送目標: { rich_text: {} },
};

// Customer DB 付款狀態 already exists as "未付款 / 已付款" select.
// We need to extend it to include 付款中 / 付款失敗 if missing.
async function ensureOrderProps() {
    const db = await notion.databases.retrieve({ database_id: ORDER_DB_ID });
    const existing = db.properties || {};
    const toAdd = {};
    for (const [name, schema] of Object.entries(ORDER_NEW_PROPS)) {
        if (!existing[name]) toAdd[name] = schema;
    }

    // Extend 訂單狀態 to include 重新選擇付款方式 if it's a status property
    const orderStatus = existing['訂單狀態'];
    if (orderStatus?.type === 'status' && !orderStatus.status.options.find((o) => o.name === '重新選擇付款方式')) {
        console.log('⚠️  訂單狀態 needs "重新選擇付款方式" — Notion API does not allow editing status options, please add manually in UI.');
    }

    // Extend 付款狀態 enum
    const paymentStatus = existing['付款狀態'];
    if (paymentStatus?.type === 'status') {
        const need = ['待付款', '付款中', '已付款', '付款失敗'];
        const missing = need.filter((n) => !paymentStatus.status.options.find((o) => o.name === n));
        if (missing.length) console.log(`⚠️  付款狀態 (status) missing options: ${missing.join(', ')} — add manually.`);
    } else if (paymentStatus?.type === 'select') {
        const need = ['待付款', '付款中', '已付款', '付款失敗'];
        const merged = [
            ...paymentStatus.select.options,
            ...need
                .filter((n) => !paymentStatus.select.options.find((o) => o.name === n))
                .map((name) => ({ name, color: name === '已付款' ? 'green' : name === '付款失敗' ? 'red' : 'yellow' })),
        ];
        toAdd['付款狀態'] = { select: { options: merged } };
    }

    if (Object.keys(toAdd).length === 0) {
        console.log('✅ Order DB already has all Phase 1 properties.');
        return;
    }

    console.log(`📝 Adding to Order DB: ${Object.keys(toAdd).join(', ')}`);
    await notion.databases.update({ database_id: ORDER_DB_ID, properties: toAdd });
    console.log('✅ Order DB updated.');
}

async function ensureCustomerProps() {
    const db = await notion.databases.retrieve({ database_id: CUSTOMER_DB_ID });
    const paymentStatus = db.properties?.['付款狀態'];
    if (!paymentStatus) {
        console.log('⚠️  Customer DB has no 付款狀態 — skipping.');
        return;
    }
    if (paymentStatus.type === 'status') {
        const need = ['未付款', '付款中', '已付款', '付款失敗'];
        const missing = need.filter((n) => !paymentStatus.status.options.find((o) => o.name === n));
        if (missing.length) console.log(`⚠️  Customer DB 付款狀態 (status) missing: ${missing.join(', ')} — add manually.`);
        return;
    }
    if (paymentStatus.type === 'select') {
        const need = ['未付款', '付款中', '已付款', '付款失敗'];
        const merged = [
            ...paymentStatus.select.options,
            ...need
                .filter((n) => !paymentStatus.select.options.find((o) => o.name === n))
                .map((name) => ({ name, color: name === '已付款' ? 'green' : name === '付款失敗' ? 'red' : 'yellow' })),
        ];
        await notion.databases.update({
            database_id: CUSTOMER_DB_ID,
            properties: { 付款狀態: { select: { options: merged } } },
        });
        console.log('✅ Customer DB 付款狀態 options extended.');
    }
}

async function main() {
    console.log('Migrating Notion DBs for Phase 1 payment lifecycle...\n');
    await ensureOrderProps();
    await ensureCustomerProps();
    console.log('\n🎉 Done.');
}

main().catch((err) => {
    console.error('❌ Migration failed:', err.message);
    if (err.body) console.error(JSON.stringify(err.body, null, 2));
    process.exit(1);
});
