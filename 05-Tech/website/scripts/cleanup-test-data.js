/**
 * Cleanup Test Data — admin 後台測試資料清除腳本
 *
 * 範圍（Notion archive，可在 trash 30 天內還原）：
 *   1. 服務項目 (Notion Services)        — 名稱含 "Test"（不分大小寫）
 *   2. 訂單 (Notion Orders)              — 關聯到測試客戶 / 測試服務
 *   3. 客戶 (Notion Customers)           — email 為 dori.rito.happydays@gmail.com 或姓名含「測試」
 *   4. 問卷 (Notion Questionnaires)      — 同客戶條件
 *   5. processed_orders (Postgres)       — booking_data.serviceName 含 Test、email 為測試 email、或 customerName 含「測試」
 *
 * 用法：
 *   cd 05-Tech/website
 *   node scripts/cleanup-test-data.js              # dry-run（預設）
 *   node scripts/cleanup-test-data.js --apply      # 實際 archive
 */

import { readFileSync } from 'fs';
// Load env: prefer .env.production.local (from `vercel env pull`), fall back to .env.local
const envFile = process.argv.find((a) => a.startsWith('--env='))?.slice(6)
    || (process.argv.includes('--prod') ? '.env.production.local' : '.env.local');
try {
    readFileSync(envFile, 'utf-8').split('\n').forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) {
            // Strip quotes and trailing literal \n (Vercel env pull artifact)
            process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '').replace(/\\n$/, '');
        }
    });
    console.log(`📄 Loaded env from ${envFile}`);
} catch { console.warn(`⚠️  Could not read ${envFile}`); }

const APPLY = process.argv.includes('--apply');
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';

const KEY = process.env.NOTION_API_KEY_CRM || process.env.NOTION_API_KEY;
const DS = {
    customers: process.env.NOTION_CUSTOMER_DS_ID,
    orders: process.env.NOTION_ORDER_DS_ID,
    services: process.env.NOTION_SERVICE_DS_ID,
};
const QUESTIONNAIRE_DB = process.env.NOTION_QUESTIONNAIRE_DB_ID;

if (!KEY) {
    console.error('❌ Missing NOTION_API_KEY_CRM / NOTION_API_KEY');
    process.exit(1);
}
for (const [k, v] of Object.entries({ ...DS, QUESTIONNAIRE_DB })) {
    if (!v) console.warn(`⚠️  Missing NOTION_${k.toUpperCase()}_DS_ID / DB_ID — 該類別將略過`);
}

const TEST_EMAIL = 'dori.rito.happydays@gmail.com';
const TEST_NAME_KEYWORD = '測試';
const TEST_SERVICE_REGEX = /test/i;

async function notion(path, opts = {}) {
    const res = await fetch(`${NOTION_API}${path}`, {
        method: opts.method || 'GET',
        headers: {
            Authorization: `Bearer ${KEY}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text();
        // Notion API uses 2025-09-03+ for data_sources; older versions need databases endpoint.
        if (res.status === 404 && path.startsWith('/data_sources/')) {
            const fallback = path.replace('/data_sources/', '/databases/');
            return notion(fallback, opts);
        }
        throw new Error(`${opts.method || 'GET'} ${path} → ${res.status} ${text}`);
    }
    return res.json();
}

async function queryAll(dsId, filter) {
    const all = [];
    let cursor;
    do {
        // Try data_sources endpoint first (v5), fall back to databases (v3-style)
        const body = { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}), ...(filter ? { filter } : {}) };
        const res = await notion(`/data_sources/${dsId}/query`, { method: 'POST', body });
        all.push(...res.results);
        cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
    return all;
}

const plain = (rt) => (rt || []).map((t) => t.plain_text).join('');
const titleOf = (page, field) => plain(page.properties?.[field]?.title);
const emailOf = (page, field) => page.properties?.[field]?.email || '';
const richOf = (page, field) => plain(page.properties?.[field]?.rich_text);

async function archivePage(id) {
    return notion(`/pages/${id}`, { method: 'PATCH', body: { archived: true } });
}

// ---------- 1. Services ----------
async function findTestServices() {
    if (!DS.services) return [];
    const pages = await queryAll(DS.services);
    return pages
        .map((p) => ({ id: p.id, name: titleOf(p, '名稱') }))
        .filter((s) => TEST_SERVICE_REGEX.test(s.name));
}

// ---------- 3. Customers ----------
async function findTestCustomers() {
    if (!DS.customers) return [];
    const pages = await queryAll(DS.customers);
    return pages
        .map((p) => ({
            id: p.id,
            name: titleOf(p, '客戶姓名'),
            email: emailOf(p, '聯絡Email'),
            phone: richOf(p, '聯絡手機號碼 Mobile number '),
        }))
        .filter((c) => c.email === TEST_EMAIL || c.name.includes(TEST_NAME_KEYWORD));
}

// ---------- 2. Orders ----------
async function findTestOrders(testCustomerIds, testServiceIds) {
    if (!DS.orders) return [];
    const pages = await queryAll(DS.orders);
    const cset = new Set(testCustomerIds);
    const sset = new Set(testServiceIds);
    return pages
        .map((p) => {
            const cIds = (p.properties?.['客戶姓名']?.relation || []).map((r) => r.id);
            const sIds = (p.properties?.['服務項目']?.relation || []).map((r) => r.id);
            return {
                id: p.id,
                orderNumber: titleOf(p, '訂單編號'),
                customerIds: cIds,
                serviceIds: sIds,
                hitCustomer: cIds.some((id) => cset.has(id)),
                hitService: sIds.some((id) => sset.has(id)),
            };
        })
        .filter((o) => o.hitCustomer || o.hitService);
}

// ---------- 5. Postgres processed_orders ----------
async function findTestProcessedOrders() {
    const { neon } = await import('@neondatabase/serverless');
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  Missing DATABASE_URL — Postgres 清理略過');
        return { rows: [], sql: null };
    }
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
        SELECT
            merchant_trade_no,
            booking_data->>'customerName' as customer_name,
            booking_data->>'serviceName' as service_name,
            booking_data->>'email' as email,
            booking_data->>'slotDate' as slot_date,
            booking_data->>'slotTime' as slot_time,
            processed_at
        FROM processed_orders
        WHERE
            booking_data->>'serviceName' ~* 'test'
            OR booking_data->>'email' = ${TEST_EMAIL}
            OR booking_data->>'customerName' LIKE ${'%' + TEST_NAME_KEYWORD + '%'}
        ORDER BY processed_at DESC NULLS LAST
    `;
    return { rows, sql };
}

// ---------- 4. Questionnaires ----------
async function findTestQuestionnaires() {
    if (!QUESTIONNAIRE_DB) return [];
    const pages = await queryAll(QUESTIONNAIRE_DB);
    return pages
        .map((p) => ({
            id: p.id,
            name: titleOf(p, '怎麼稱呼你 Your name'),
            email: emailOf(p, '聯絡Email'),
        }))
        .filter((q) => q.email === TEST_EMAIL || q.name.includes(TEST_NAME_KEYWORD));
}

// ---------- main ----------
(async () => {
    console.log(`\n🔍 Cleanup Test Data — mode: ${APPLY ? '\x1b[31mAPPLY (will archive)\x1b[0m' : '\x1b[36mDRY-RUN\x1b[0m'}`);
    console.log(`條件：email=${TEST_EMAIL}、姓名含「${TEST_NAME_KEYWORD}」、服務名稱含 /test/i\n`);

    const services = await findTestServices();
    console.log(`【1】Services → ${services.length} 筆`);
    services.forEach((s) => console.log(`   - ${s.id}  ${s.name}`));

    const customers = await findTestCustomers();
    console.log(`\n【3】Customers → ${customers.length} 筆`);
    customers.forEach((c) => console.log(`   - ${c.id}  ${c.name} <${c.email}> ${c.phone}`));

    const orders = await findTestOrders(customers.map((c) => c.id), services.map((s) => s.id));
    console.log(`\n【2】Orders → ${orders.length} 筆`);
    orders.forEach((o) =>
        console.log(`   - ${o.id}  ${o.orderNumber}  [${o.hitCustomer ? '客戶' : ''}${o.hitService ? '+服務' : ''}]`)
    );

    const questionnaires = await findTestQuestionnaires();
    console.log(`\n【4】Questionnaires → ${questionnaires.length} 筆`);
    questionnaires.forEach((q) => console.log(`   - ${q.id}  ${q.name} <${q.email}>`));

    const { rows: pgRows, sql: pgSql } = await findTestProcessedOrders();
    console.log(`\n【5】Postgres processed_orders → ${pgRows.length} 筆`);
    pgRows.forEach((r) =>
        console.log(`   - ${r.merchant_trade_no}  ${r.customer_name} <${r.email}>  ${r.service_name}  ${r.slot_date} ${r.slot_time}`)
    );

    const total = services.length + customers.length + orders.length + questionnaires.length + pgRows.length;
    console.log(`\n總計 ${total} 筆${APPLY ? ' 即將刪除' : '（dry-run，未動）'}`);

    if (!APPLY || total === 0) {
        console.log(APPLY ? '\n沒有資料需要刪除' : '\n要實際執行請加 --apply');
        return;
    }

    console.log('\n⏳ Deleting...（Notion: Orders → Questionnaires → Customers → Services；Postgres 最後）');
    const notionItems = [
        ...orders.map((o) => ({ id: o.id, label: `Order ${o.orderNumber}` })),
        ...questionnaires.map((q) => ({ id: q.id, label: `Questionnaire ${q.name}` })),
        ...customers.map((c) => ({ id: c.id, label: `Customer ${c.name}` })),
        ...services.map((s) => ({ id: s.id, label: `Service ${s.name}` })),
    ];

    let ok = 0, fail = 0;
    for (const item of notionItems) {
        try {
            await archivePage(item.id);
            console.log(`   ✅ [Notion archive] ${item.label}`);
            ok++;
        } catch (err) {
            console.log(`   ❌ [Notion archive] ${item.label} — ${err.message}`);
            fail++;
        }
    }

    if (pgRows.length > 0 && pgSql) {
        const ids = pgRows.map((r) => r.merchant_trade_no);
        try {
            const deleted = await pgSql`DELETE FROM processed_orders WHERE merchant_trade_no = ANY(${ids}) RETURNING merchant_trade_no`;
            console.log(`   ✅ [Postgres DELETE] processed_orders × ${deleted.length}`);
            ok += deleted.length;
        } catch (err) {
            console.log(`   ❌ [Postgres DELETE] failed — ${err.message}`);
            fail++;
        }
    }

    console.log(`\n完成：成功 ${ok}、失敗 ${fail}`);
    console.log('提醒：dashboard 有 5 分鐘 cache，刷新後若還看到舊資料請等 5 分鐘或重啟 server');
    if (fail > 0) process.exit(1);
})();
