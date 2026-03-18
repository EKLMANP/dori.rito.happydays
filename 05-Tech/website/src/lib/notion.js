/**
 * Shared Notion Client for Admin Console
 * =======================================
 * Wraps Notion API operations for Customer, Order, and Service databases.
 * Field names match the actual Notion database schemas exactly.
 */

import { Client } from '@notionhq/client';

// --- Singleton client ---
let _client = null;
function getClient() {
    if (!_client) {
        const auth = process.env.NOTION_API_KEY;
        if (!auth) throw new Error('NOTION_API_KEY is not set');
        _client = new Client({ auth });
    }
    return _client;
}

// --- Data Source IDs (v5 SDK uses dataSources.query instead of databases.query) ---
const DS = {
    get customers() { return process.env.NOTION_CUSTOMER_DS_ID; },
    get orders() { return process.env.NOTION_ORDER_DS_ID; },
    get services() { return process.env.NOTION_SERVICE_DS_ID; },
};

// --- Database IDs (for pages.create parent) ---
const DB = {
    get customers() { return process.env.NOTION_CUSTOMER_DB_ID; },
    get orders() { return process.env.NOTION_ORDER_DB_ID; },
    get services() { return process.env.NOTION_SERVICE_CATALOG_DB_ID; },
};

/** Query helper — uses v5 dataSources.query API */
function queryDS(dataSourceId, options = {}) {
    return getClient().dataSources.query({ data_source_id: dataSourceId, ...options });
}

// ============================================================
// Helpers
// ============================================================

/** Extract plain text from a Notion rich_text array */
function plainText(richTextArray) {
    if (!richTextArray?.length) return '';
    return richTextArray.map((t) => t.plain_text).join('');
}

/** Extract title text from a Notion title property */
function titleText(titleArray) {
    return plainText(titleArray);
}

/** Format a Notion page's properties into a flat JS object */
function formatCustomer(page) {
    const p = page.properties;
    return {
        id: page.id,
        name: titleText(p['客戶姓名']?.title),
        dogName: plainText(p['狗狗名字 Name of your lovely dog']?.rich_text),
        phone: plainText(p['聯絡手機號碼 Mobile number ']?.rich_text),
        email: p['聯絡Email']?.email || '',
        address: plainText(p['地址']?.rich_text),
        conversionStatus: p['轉換狀態']?.status?.name || '',
        firstCall: p['1st call']?.date?.start || null,
        notes: plainText(p['Notes']?.rich_text),
        trainer: p['Trainer']?.select?.name || '',
        // Order-related fields still on Customer DB (legacy, will migrate later)
        serviceType: (p['付費服務類別']?.multi_select || []).map(s => s.name),
        paymentStatus: p['付款狀態']?.status?.name || '',
        orderNumber: plainText(p['訂單編號']?.rich_text),
        createdTime: page.created_time,
    };
}

function formatOrder(page) {
    const p = page.properties;
    const sessions = p['購買課堂數']?.number ?? 0;
    const unitPrice = p['單堂課報價']?.number ?? 0;
    return {
        id: page.id,
        orderNumber: titleText(p['訂單編號']?.title),
        customerIds: (p['客戶姓名']?.relation || []).map((r) => r.id),
        serviceIds: (p['服務項目']?.relation || []).map((r) => r.id),
        trainer: p['訓犬師']?.select?.name || '',
        sessions,
        unitPrice,
        totalAmount: sessions * unitPrice,
        remainingSessions: p['剩餘課堂數']?.number ?? 0,
        orderStatus: p['訂單狀態']?.status?.name || '',
        paymentStatus: p['付款狀態']?.status?.name || '',
        transferDate: p['匯款日期']?.date?.start || null,
        bankLast5: plainText(p['帳號後五碼']?.rich_text),
        startDate: p['開始日期']?.date?.start || null,
        endDate: p['結束日期']?.date?.start || null,
        createdTime: page.created_time,
        notes: plainText(p['備註']?.rich_text),
    };
}

function formatService(page) {
    const p = page.properties;
    return {
        id: page.id,
        name: titleText(p['名稱']?.title),
        code: plainText(p['代碼']?.rich_text),
        type: (p['類型']?.multi_select || []).map(s => s.name).join(', '),
        defaultSessions: p['預設堂數']?.number ?? 0,
        suggestedPrice: p['單價']?.number ?? 0,
        status: p['是否上架']?.status?.name || '',
        description: plainText(p['服務說明']?.rich_text),
    };
}

// ============================================================
// Customers
// ============================================================

/** List customers with optional filters */
export async function listCustomers({ startCursor, pageSize = 20, status } = {}) {
    const filters = [];
    if (status) {
        filters.push({ property: '轉換狀態', status: { equals: status } });
    }

    const query = {
        page_size: pageSize,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    };
    if (startCursor) query.start_cursor = startCursor;
    if (filters.length === 1) query.filter = filters[0];
    if (filters.length > 1) query.filter = { and: filters };

    const res = await queryDS(DS.customers, query);
    return {
        customers: res.results.map(formatCustomer),
        hasMore: res.has_more,
        nextCursor: res.next_cursor,
    };
}

/** Search customers by name, phone, or email */
export async function searchCustomers(query) {
    if (!query?.trim()) return [];

    const searchTerm = query.trim();
    const filters = [
        { property: '客戶姓名', title: { contains: searchTerm } },
        { property: '聯絡Email', email: { contains: searchTerm } },
        { property: '聯絡手機號碼 Mobile number ', rich_text: { contains: searchTerm } },
    ];

    const res = await queryDS(DS.customers, {
        filter: { or: filters },
        page_size: 10,
    });

    return res.results.map(formatCustomer);
}

/** Find existing customer by phone or email (for deduplication) */
export async function findCustomerByPhoneOrEmail({ phone, email }) {
    const filters = [];
    if (phone) {
        filters.push({ property: '聯絡手機號碼 Mobile number ', rich_text: { equals: phone } });
    }
    if (email) {
        filters.push({ property: '聯絡Email', email: { equals: email } });
    }
    if (filters.length === 0) return null;

    const res = await queryDS(DS.customers, {
        filter: filters.length === 1 ? filters[0] : { or: filters },
        page_size: 1,
    });

    return res.results.length > 0 ? formatCustomer(res.results[0]) : null;
}

/** Get single customer by page ID */
export async function getCustomer(pageId) {
    const page = await getClient().pages.retrieve({ page_id: pageId });
    return formatCustomer(page);
}

/** Create a new customer (with dedup check) */
export async function createCustomer({ name, dogName, phone, email, address, notes }) {
    // Dedup check
    if (phone || email) {
        const existing = await findCustomerByPhoneOrEmail({ phone, email });
        if (existing) {
            return { customer: existing, created: false, message: '客戶已存在' };
        }
    }

    const properties = {
        '客戶姓名': { title: [{ text: { content: name } }] },
    };
    if (dogName) properties['狗狗名字 Name of your lovely dog'] = { rich_text: [{ text: { content: dogName } }] };
    if (phone) properties['聯絡手機號碼 Mobile number '] = { rich_text: [{ text: { content: phone } }] };
    if (email) properties['聯絡Email'] = { email };
    if (address) properties['地址'] = { rich_text: [{ text: { content: address } }] };
    if (notes) properties['Notes'] = { rich_text: [{ text: { content: notes } }] };

    const page = await getClient().pages.create({
        parent: { database_id: DB.customers },
        properties,
    });

    return { customer: formatCustomer(page), created: true };
}

/** Update customer properties */
export async function updateCustomer(pageId, updates) {
    const properties = {};

    if (updates.name !== undefined) properties['客戶姓名'] = { title: [{ text: { content: updates.name } }] };
    if (updates.dogName !== undefined) properties['狗狗名字 Name of your lovely dog'] = { rich_text: [{ text: { content: updates.dogName } }] };
    if (updates.phone !== undefined) properties['聯絡手機號碼 Mobile number '] = { rich_text: [{ text: { content: updates.phone } }] };
    if (updates.email !== undefined) properties['聯絡Email'] = { email: updates.email || null };
    if (updates.address !== undefined) properties['地址'] = { rich_text: [{ text: { content: updates.address } }] };
    if (updates.conversionStatus !== undefined) properties['轉換狀態'] = { status: { name: updates.conversionStatus } };
    if (updates.notes !== undefined) properties['Notes'] = { rich_text: [{ text: { content: updates.notes } }] };

    const page = await getClient().pages.update({ page_id: pageId, properties });
    return formatCustomer(page);
}

// ============================================================
// Orders
// ============================================================

/** Generate next order number */
async function generateOrderNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${dateStr}-`;

    const res = await queryDS(DS.orders, {
        filter: {
            property: '訂單編號',
            title: { starts_with: prefix },
        },
        sorts: [{ property: '訂單編號', direction: 'descending' }],
        page_size: 1,
    });

    let seq = 1;
    if (res.results.length > 0) {
        const lastNumber = titleText(res.results[0].properties['訂單編號']?.title);
        const lastSeq = parseInt(lastNumber.split('-').pop(), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
}

/** List orders with optional filters */
export async function listOrders({ startCursor, pageSize = 20, status, paymentStatus, trainer } = {}) {
    const filters = [];
    if (status) {
        filters.push({ property: '訂單狀態', status: { equals: status } });
    }
    if (paymentStatus) {
        filters.push({ property: '付款狀態', status: { equals: paymentStatus } });
    }
    if (trainer) {
        filters.push({ property: '訓犬師', select: { equals: trainer } });
    }

    const query = {
        page_size: pageSize,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    };
    if (startCursor) query.start_cursor = startCursor;
    if (filters.length === 1) query.filter = filters[0];
    if (filters.length > 1) query.filter = { and: filters };

    const res = await queryDS(DS.orders, query);
    return {
        orders: res.results.map(formatOrder),
        hasMore: res.has_more,
        nextCursor: res.next_cursor,
    };
}

/** Get single order by page ID */
export async function getOrder(pageId) {
    const page = await getClient().pages.retrieve({ page_id: pageId });
    return formatOrder(page);
}

/** Create a new order */
export async function createOrder({ customerId, serviceId, trainer, sessions, unitPrice, notes }) {
    const orderNumber = await generateOrderNumber();

    const properties = {
        '訂單編號': { title: [{ text: { content: orderNumber } }] },
        '客戶姓名': { relation: [{ id: customerId }] },
        '服務項目': { relation: [{ id: serviceId }] },
        '購買課堂數': { number: sessions },
        '單堂課報價': { number: unitPrice },
        '剩餘課堂數': { number: sessions },
        '訂單狀態': { status: { name: '報價中' } },
        '付款狀態': { status: { name: '待付款' } },
    };
    if (trainer) properties['訓犬師'] = { select: { name: trainer } };
    if (notes) properties['備註'] = { rich_text: [{ text: { content: notes } }] };

    const page = await getClient().pages.create({
        parent: { database_id: DB.orders },
        properties,
    });

    return formatOrder(page);
}

/** Update order properties */
export async function updateOrder(pageId, updates) {
    const properties = {};

    if (updates.trainer !== undefined) properties['訓犬師'] = { select: updates.trainer ? { name: updates.trainer } : null };
    if (updates.sessions !== undefined) properties['購買課堂數'] = { number: updates.sessions };
    if (updates.unitPrice !== undefined) properties['單堂課報價'] = { number: updates.unitPrice };
    if (updates.remainingSessions !== undefined) properties['剩餘課堂數'] = { number: updates.remainingSessions };
    if (updates.orderStatus !== undefined) properties['訂單狀態'] = { status: { name: updates.orderStatus } };
    if (updates.paymentStatus !== undefined) properties['付款狀態'] = { status: { name: updates.paymentStatus } };
    if (updates.transferDate !== undefined) properties['匯款日期'] = { date: updates.transferDate ? { start: updates.transferDate } : null };
    if (updates.bankLast5 !== undefined) properties['帳號後五碼'] = { rich_text: [{ text: { content: updates.bankLast5 } }] };
    if (updates.startDate !== undefined) properties['開始日期'] = { date: updates.startDate ? { start: updates.startDate } : null };
    if (updates.endDate !== undefined) properties['結束日期'] = { date: updates.endDate ? { start: updates.endDate } : null };
    if (updates.notes !== undefined) properties['備註'] = { rich_text: [{ text: { content: updates.notes } }] };

    const page = await getClient().pages.update({ page_id: pageId, properties });
    return formatOrder(page);
}

// ============================================================
// Services
// ============================================================

/** List all services (optionally only active ones) */
export async function listServices({ activeOnly = false } = {}) {
    const query = {
        sorts: [{ property: '名稱', direction: 'ascending' }],
        page_size: 50,
    };
    if (activeOnly) {
        query.filter = { property: '是否上架', status: { equals: 'Live' } };
    }

    const res = await queryDS(DS.services, query);
    return res.results.map(formatService);
}

/** Get single service by page ID */
export async function getService(pageId) {
    const page = await getClient().pages.retrieve({ page_id: pageId });
    return formatService(page);
}

/** Create a new service */
export async function createService({ name, code, type, defaultSessions, suggestedPrice, status, description }) {
    const properties = {
        '名稱': { title: [{ text: { content: name } }] },
    };
    if (code) properties['代碼'] = { rich_text: [{ text: { content: code } }] };
    if (type) properties['類型'] = { multi_select: type.split(',').map(t => ({ name: t.trim() })) };
    if (defaultSessions != null) properties['預設堂數'] = { number: defaultSessions };
    if (suggestedPrice != null) properties['單價'] = { number: suggestedPrice };
    if (status) properties['是否上架'] = { status: { name: status } };
    if (description) properties['服務說明'] = { rich_text: [{ text: { content: description } }] };

    const page = await getClient().pages.create({
        parent: { database_id: DB.services },
        properties,
    });

    return formatService(page);
}

/** Update service properties */
export async function updateService(pageId, updates) {
    const properties = {};

    if (updates.name !== undefined) properties['名稱'] = { title: [{ text: { content: updates.name } }] };
    if (updates.code !== undefined) properties['代碼'] = { rich_text: [{ text: { content: updates.code } }] };
    if (updates.type !== undefined) properties['類型'] = { multi_select: updates.type ? updates.type.split(',').map(t => ({ name: t.trim() })) : [] };
    if (updates.defaultSessions !== undefined) properties['預設堂數'] = { number: updates.defaultSessions };
    if (updates.suggestedPrice !== undefined) properties['單價'] = { number: updates.suggestedPrice };
    if (updates.status !== undefined) properties['是否上架'] = { status: { name: updates.status } };
    if (updates.description !== undefined) properties['服務說明'] = { rich_text: [{ text: { content: updates.description } }] };

    const page = await getClient().pages.update({ page_id: pageId, properties });
    return formatService(page);
}

// ============================================================
// Dashboard stats
// ============================================================

/** Get summary stats for the admin dashboard */
export async function getDashboardStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [activeOrders, monthOrders, unpaidOrders] = await Promise.all([
        queryDS(DS.orders, {
            filter: { property: '訂單狀態', status: { equals: '進行中' } },
            page_size: 100,
        }),
        queryDS(DS.orders, {
            filter: {
                timestamp: 'created_time',
                created_time: { on_or_after: monthStart },
            },
            page_size: 100,
        }),
        queryDS(DS.orders, {
            filter: {
                and: [
                    { property: '付款狀態', status: { does_not_equal: '已付款' } },
                    { property: '訂單狀態', status: { does_not_equal: '已取消' } },
                ],
            },
            page_size: 100,
        }),
    ]);

    const monthRevenue = monthOrders.results.reduce((sum, page) => {
        const sessions = page.properties['購買課堂數']?.number || 0;
        const price = page.properties['單堂課報價']?.number || 0;
        return sum + (sessions * price);
    }, 0);

    return {
        activeOrderCount: activeOrders.results.length,
        monthOrderCount: monthOrders.results.length,
        monthRevenue,
        unpaidOrderCount: unpaidOrders.results.length,
        activeOrders: activeOrders.results.map(formatOrder),
        unpaidOrders: unpaidOrders.results.map(formatOrder),
    };
}
