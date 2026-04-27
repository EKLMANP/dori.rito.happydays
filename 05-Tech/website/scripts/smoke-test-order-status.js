/**
 * Smoke test: 驗證所有「訂單狀態 / 付款狀態」寫入路徑不會被 Notion 退件。
 *
 * 測試範圍（對應本次重構）：
 *   1. createPendingOrder         → 訂單狀態=未開始, 付款狀態=待付款
 *   2. updateOrderPaymentMethod   → 付款狀態=付款中
 *   3. updateOrderPaid            → 訂單狀態=待排課, 付款狀態=已付款
 *   4. updateOrder (admin PATCH)  → 訂單狀態 走過 待排課→已排課→上課中→完課
 *   5. markOrderSuperseded        → 付款狀態=付款失敗（不再寫 訂單狀態=已取消）
 *   6. expire-payments cron PATCH → 付款狀態=付款失敗
 *
 * 每個寫入路徑會直接打 Notion API；任何 400 都會 fail。
 * 結束時會 archive 測試用的 page。
 *
 * 執行：cd 05-Tech/website && node scripts/smoke-test-order-status.js
 */

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
    console.error('❌ Missing NOTION_API_KEY (or NOTION_API_KEY_CRM) / NOTION_ORDER_DB_ID in .env.local');
    process.exit(1);
}

async function notion(path, opts = {}) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
        method: opts.method || 'GET',
        headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status}: ${text}`);
    return text ? JSON.parse(text) : {};
}

const tradeNo = `SMOKE${Date.now()}`;
let pageId;
const results = [];

async function step(name, fn) {
    try {
        await fn();
        results.push({ name, ok: true });
        console.log(`  ✅ ${name}`);
    } catch (err) {
        results.push({ name, ok: false, err: err.message });
        console.log(`  ❌ ${name}\n     ${err.message}`);
    }
}

console.log(`\n🔬 Smoke test：訂單狀態 / 付款狀態 寫入路徑\n   測試訂單編號：${tradeNo}\n`);

// 1. createPendingOrder
await step('createPendingOrder（訂單狀態=未開始, 付款狀態=待付款）', async () => {
    const page = await notion('/pages', {
        method: 'POST',
        body: {
            parent: { database_id: ORDER_DB_ID },
            properties: {
                '訂單編號': { title: [{ text: { content: tradeNo } }] },
                '訂單狀態': { status: { name: '未開始' } },
                '付款狀態': { status: { name: '待付款' } },
                '備註': { rich_text: [{ text: { content: '[smoke-test] 自動建立，測試完會 archive' } }] },
            },
        },
    });
    pageId = page.id;
});

if (!pageId) {
    console.error('\n❌ 無法建立測試 page，後續步驟跳過。請檢查 Notion 是否還有「未開始」選項。');
    process.exit(1);
}

console.log(`   建立成功 → page: ${pageId}\n`);

// 2. updateOrderPaymentMethod
await step('updateOrderPaymentMethod（付款狀態=付款中）', async () => {
    await notion(`/pages/${pageId}`, {
        method: 'PATCH',
        body: { properties: { '付款狀態': { status: { name: '付款中' } } } },
    });
});

// 3. updateOrderPaid
await step('updateOrderPaid（訂單狀態=待排課, 付款狀態=已付款）', async () => {
    await notion(`/pages/${pageId}`, {
        method: 'PATCH',
        body: {
            properties: {
                '訂單狀態': { status: { name: '待排課' } },
                '付款狀態': { status: { name: '已付款' } },
            },
        },
    });
});

// 4. admin PATCH 走完狀態機
for (const next of ['已排課', '上課中', '完課']) {
    await step(`updateOrder → 訂單狀態=${next}`, async () => {
        await notion(`/pages/${pageId}`, {
            method: 'PATCH',
            body: { properties: { '訂單狀態': { status: { name: next } } } },
        });
    });
}

// 5. markOrderSuperseded（重點：不再寫訂單狀態=已取消）
await step('markOrderSuperseded（只寫 付款狀態=付款失敗）', async () => {
    await notion(`/pages/${pageId}`, {
        method: 'PATCH',
        body: {
            properties: {
                '付款狀態': { status: { name: '付款失敗' } },
                '備註': { rich_text: [{ text: { content: '[smoke-test] markOrderSuperseded 模擬' } }] },
            },
        },
    });
});

// 6. expire-payments cron PATCH
await step('expire-payments cron（只寫 付款狀態=付款失敗）', async () => {
    await notion(`/pages/${pageId}`, {
        method: 'PATCH',
        body: { properties: { '付款狀態': { status: { name: '付款失敗' } } } },
    });
});

// Cleanup：archive 測試 page
await step('清理：archive 測試 page', async () => {
    await notion(`/pages/${pageId}`, {
        method: 'PATCH',
        body: { archived: true },
    });
});

const passed = results.filter(r => r.ok).length;
const failed = results.length - passed;
console.log(`\n📊 結果：${passed} pass / ${failed} fail（共 ${results.length}）`);
if (failed > 0) {
    console.log('\n失敗項目：');
    results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.name}\n    ${r.err}`));
    process.exit(1);
}
console.log('\n✅ 所有寫入路徑都通過，可以 merge\n');
