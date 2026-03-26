#!/usr/bin/env node
/**
 * Notion Database Architecture Setup Script
 * ==========================================
 * Creates the 3-database relational architecture for Dori & Rito:
 *   1. Service Catalog DB (服務項目)
 *   2. Order Management DB (訂單管理)
 *   3. Updates Customer DB (客戶管理) with new properties + Relations
 *
 * Usage:
 *   NOTION_API_KEY=xxx NOTION_CUSTOMER_DB_ID=xxx node scripts/setup-notion-databases.js
 *
 * Optional:
 *   NOTION_PARENT_PAGE_ID=xxx  — Parent page to create new DBs under (default: workspace root)
 */

const { Client } = require('@notionhq/client');

// --- Configuration ---
const NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_QUOTATION_TOKEN;
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_DB_ID || process.env.NOTION_CUSTOMER_DATABASE_ID || '22a17e11503d80eea2b5ccbe69a16c59';
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID; // Optional: page to nest new DBs under

if (!NOTION_API_KEY) {
    console.error('Error: NOTION_API_KEY or NOTION_QUOTATION_TOKEN environment variable is required.');
    console.error('Usage: NOTION_API_KEY=secret_xxx node scripts/setup-notion-databases.js');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// --- Helper ---
function log(emoji, msg) {
    console.log(`${emoji} ${msg}`);
}

// --- Step 1: Create Service Catalog DB ---
async function createServiceCatalogDB() {
    log('📦', 'Creating Service Catalog DB (服務項目)...');

    const parent = PARENT_PAGE_ID
        ? { type: 'page_id', page_id: PARENT_PAGE_ID }
        : { type: 'page_id', page_id: CUSTOMER_DB_ID }; // Will use workspace if no parent

    // For database creation, we need a parent page, not a database
    // If no parent page is specified, we'll create it at workspace level
    const dbPayload = {
        parent: PARENT_PAGE_ID
            ? { type: 'page_id', page_id: PARENT_PAGE_ID }
            : undefined,
        is_inline: false,
        title: [{ type: 'text', text: { content: '服務項目 Service Catalog' } }],
        description: [{ type: 'text', text: { content: 'Dori & Rito 服務目錄 — 所有可購買的服務類型' } }],
        properties: {
            '服務名稱': { title: {} },
            '服務代碼': { rich_text: {} },
            '服務類型': {
                select: {
                    options: [
                        { name: '一對一訓犬', color: 'blue' },
                        { name: '團體課程', color: 'green' },
                        { name: '線上課程', color: 'purple' },
                        { name: '講座', color: 'orange' },
                        { name: '其他', color: 'gray' },
                    ],
                },
            },
            '預設堂數': { number: { format: 'number' } },
            '建議單價': { number: { format: 'number_with_commas' } },
            '服務狀態': {
                select: {
                    options: [
                        { name: '上架中', color: 'green' },
                        { name: '已下架', color: 'red' },
                    ],
                },
            },
            '服務說明': { rich_text: {} },
        },
    };

    // If no parent page, create at workspace level (remove parent)
    if (!PARENT_PAGE_ID) {
        // Notion API requires a parent. Let's check if we can use a page.
        // We'll ask the user to provide NOTION_PARENT_PAGE_ID.
        console.error('');
        console.error('NOTION_PARENT_PAGE_ID is required to create new databases.');
        console.error('Please provide the ID of a Notion page where the new databases should be created.');
        console.error('');
        console.error('To find a page ID:');
        console.error('  1. Open any Notion page');
        console.error('  2. Click "Share" → "Copy link"');
        console.error('  3. The ID is the 32-character hex string in the URL');
        console.error('');
        console.error('Example: NOTION_PARENT_PAGE_ID=abc123... NOTION_API_KEY=secret_xxx node scripts/setup-notion-databases.js');
        process.exit(1);
    }

    const serviceCatalogDB = await notion.databases.create(dbPayload);
    log('✅', `Service Catalog DB created: ${serviceCatalogDB.id}`);
    return serviceCatalogDB.id;
}

// --- Step 2: Populate initial services ---
async function populateInitialServices(serviceCatalogDBId) {
    log('📝', 'Populating initial services...');

    const services = [
        {
            '服務名稱': '1對1 八週到府訓練服務',
            '服務代碼': '1on1-8w',
            '服務類型': '一對一訓犬',
            '預設堂數': 8,
            '建議單價': 2800,
            '服務狀態': '上架中',
            '服務說明': '8 堂到府一對一正向訓犬課程，含每3天跟進、深度評估報告、LINE 即時支援、結業證書',
        },
        {
            '服務名稱': '1對1 六週到府訓練服務',
            '服務代碼': '1on1-6w',
            '服務類型': '一對一訓犬',
            '預設堂數': 6,
            '建議單價': 2800,
            '服務狀態': '上架中',
            '服務說明': '6 堂到府一對一正向訓犬課程，含每週跟進、訓練手冊、LINE 支援',
        },
        {
            '服務名稱': '1對1 線上諮詢',
            '服務代碼': '1on1-online',
            '服務類型': '線上課程',
            '預設堂數': 1,
            '建議單價': 1500,
            '服務狀態': '上架中',
            '服務說明': '線上一對一諮詢服務，適合外縣市或海外客戶',
        },
    ];

    for (const svc of services) {
        await notion.pages.create({
            parent: { database_id: serviceCatalogDBId },
            properties: {
                '服務名稱': { title: [{ text: { content: svc['服務名稱'] } }] },
                '服務代碼': { rich_text: [{ text: { content: svc['服務代碼'] } }] },
                '服務類型': { select: { name: svc['服務類型'] } },
                '預設堂數': { number: svc['預設堂數'] },
                '建議單價': { number: svc['建議單價'] },
                '服務狀態': { select: { name: svc['服務狀態'] } },
                '服務說明': { rich_text: [{ text: { content: svc['服務說明'] } }] },
            },
        });
        log('  ✓', svc['服務名稱']);
    }

    log('✅', 'Initial services populated');
}

// --- Step 3: Create Order Management DB ---
async function createOrderDB(serviceCatalogDBId) {
    log('📋', 'Creating Order Management DB (訂單管理)...');

    const orderDB = await notion.databases.create({
        parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
        is_inline: false,
        title: [{ type: 'text', text: { content: '訂單管理 Order Management' } }],
        description: [{ type: 'text', text: { content: 'Dori & Rito 訂單管理 — 追蹤所有服務訂單、付款狀態' } }],
        properties: {
            '訂單編號': { title: {} },
            '客戶': {
                relation: {
                    database_id: CUSTOMER_DB_ID,
                    single_property: {},
                },
            },
            '服務項目': {
                relation: {
                    database_id: serviceCatalogDBId,
                    single_property: {},
                },
            },
            '訓犬師': {
                select: {
                    options: [
                        { name: 'Eric Pan', color: 'blue' },
                        { name: 'Pennee Tan', color: 'pink' },
                    ],
                },
            },
            '購買課堂數': { number: { format: 'number' } },
            '單堂課報價': { number: { format: 'number_with_commas' } },
            '總金額': {
                formula: {
                    expression: 'prop("購買課堂數") * prop("單堂課報價")',
                },
            },
            '剩餘課堂數': { number: { format: 'number' } },
            '訂單狀態': {
                status: {
                    options: [
                        { name: '報價中', color: 'gray' },
                        { name: '已確認', color: 'blue' },
                        { name: '進行中', color: 'yellow' },
                        { name: '已完成', color: 'green' },
                        { name: '已取消', color: 'red' },
                    ],
                    groups: [
                        { name: 'To-do', option_ids: [] },
                        { name: 'In progress', option_ids: [] },
                        { name: 'Complete', option_ids: [] },
                    ],
                },
            },
            '付款狀態': {
                status: {
                    options: [
                        { name: '未收款', color: 'red' },
                        { name: '部分收款', color: 'yellow' },
                        { name: '已收全款', color: 'green' },
                    ],
                    groups: [
                        { name: 'To-do', option_ids: [] },
                        { name: 'In progress', option_ids: [] },
                        { name: 'Complete', option_ids: [] },
                    ],
                },
            },
            '匯款日期': { date: {} },
            '帳號後五碼': { rich_text: {} },
            '開始日期': { date: {} },
            '結束日期': { date: {} },
            '建立日期': { created_time: {} },
            '備註': { rich_text: {} },
        },
    });

    log('✅', `Order Management DB created: ${orderDB.id}`);
    return orderDB.id;
}

// --- Step 4: Update Customer DB with new properties ---
async function updateCustomerDB(orderDBId) {
    log('👤', 'Updating Customer DB (客戶管理) with new properties...');

    // Add new properties one by one (Notion API updates properties incrementally)
    const newProperties = {
        'LINE ID': { rich_text: {} },
        '來源管道': {
            select: {
                options: [
                    { name: '官網諮詢', color: 'blue' },
                    { name: 'IG', color: 'pink' },
                    { name: '口碑推薦', color: 'green' },
                    { name: '合作轉介', color: 'orange' },
                    { name: '其他', color: 'gray' },
                ],
            },
        },
        '訂單': {
            relation: {
                database_id: orderDBId,
                single_property: {},
            },
        },
    };

    await notion.databases.update({
        database_id: CUSTOMER_DB_ID,
        properties: newProperties,
    });

    log('✅', 'Customer DB updated with new properties (LINE ID, 來源管道, 訂單 Relation)');
}

// --- Main ---
async function main() {
    console.log('');
    console.log('==============================================');
    console.log('  Dori & Rito — Notion Database Setup');
    console.log('==============================================');
    console.log('');
    console.log(`Customer DB ID: ${CUSTOMER_DB_ID}`);
    console.log(`Parent Page ID: ${PARENT_PAGE_ID || '(not set)'}`);
    console.log('');

    try {
        // Step 1: Create Service Catalog DB
        const serviceCatalogDBId = await createServiceCatalogDB();

        // Step 2: Populate initial services
        await populateInitialServices(serviceCatalogDBId);

        // Step 3: Create Order Management DB (with relations to Customer + Service Catalog)
        const orderDBId = await createOrderDB(serviceCatalogDBId);

        // Step 4: Update Customer DB with Relation to Order DB
        await updateCustomerDB(orderDBId);

        // Summary
        console.log('');
        console.log('==============================================');
        console.log('  Setup Complete!');
        console.log('==============================================');
        console.log('');
        console.log('New Database IDs (save these in your .env):');
        console.log(`  NOTION_SERVICE_CATALOG_DB_ID=${serviceCatalogDBId}`);
        console.log(`  NOTION_ORDER_DB_ID=${orderDBId}`);
        console.log(`  NOTION_CUSTOMER_DB_ID=${CUSTOMER_DB_ID}`);
        console.log('');
        console.log('Next steps:');
        console.log('  1. Open Notion and verify the 3 databases are connected');
        console.log('  2. Add Rollup properties in Customer DB manually:');
        console.log('     - 訂單數量: Rollup on 訂單 → Count');
        console.log('     - 總消費金額: Rollup on 訂單 → 總金額 → Sum');
        console.log('  3. Hide old order-related columns in Customer DB (Trainer, 訂單編號, etc.)');
        console.log('  4. Migrate existing customer order data to the new Order DB');
        console.log('');
    } catch (error) {
        console.error('');
        console.error('Setup failed:', error.message);
        if (error.body) {
            console.error('Notion API error:', JSON.stringify(error.body, null, 2));
        }
        if (error.code === 'unauthorized') {
            console.error('');
            console.error('The API key does not have access. Make sure:');
            console.error('  1. The integration is connected to the workspace');
            console.error('  2. The parent page is shared with the integration');
            console.error('  3. The Customer DB is shared with the integration');
        }
        process.exit(1);
    }
}

main();
