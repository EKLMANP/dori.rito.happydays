/**
 * Notion CRM Integration — Customer Database 客戶管理
 *
 * Two-phase lifecycle:
 *   1. createCustomerPage()  — called at questionnaire completion (Step 1→2)
 *      Creates page with full Q&A, 付款狀態 = "未付款"
 *   2. updateCustomerPayment() — called after payment success (webhook)
 *      Updates 付款狀態 = "已付款", sets 付費服務類別, appends booking info
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

/** Map website serviceId → Notion service labels and metadata */
export const SERVICE_NOTION_MAP = {
    'single-session': {
        label: '1對1線上課程_1堂',
        sessions: 1,
        unitPrice: 2490,
    },
    'breakthrough-4': {
        label: '1對1線上課程_4堂_突破成長方案',
        sessions: 4,
        unitPrice: 2249.75,
    },
    'online-consult': {
        label: '1對1_線上諮詢',
        sessions: 1,
        unitPrice: 800,
    },
};

// --- Helpers ---

/**
 * Extract customer info from formSections + formResponses by matching field labels.
 */
export function extractCustomerFromForm(sections, responses) {
    let name = '';
    let email = '';
    let phone = '';
    let dogName = '';
    let address = '';

    const labelMap = {
        '怎麼稱呼你': 'name',
        '姓名': 'name',
        '聯絡 Email': 'email',
        'Email': 'email',
        '聯絡手機': 'phone',
        '聯絡電話': 'phone',
        '手機': 'phone',
        '狗狗名字': 'dogName',
        '地址': 'address',
    };

    for (const section of sections) {
        for (const field of section.fields || []) {
            const val = responses[String(field.id)];
            if (!val) continue;

            for (const [pattern, prop] of Object.entries(labelMap)) {
                if (field.label.includes(pattern)) {
                    if (prop === 'name') name = val;
                    if (prop === 'email') email = val;
                    if (prop === 'phone') phone = val;
                    if (prop === 'dogName') dogName = val;
                    if (prop === 'address') address = val;
                    break;
                }
            }

            if (field.field_type === 'email' && !email) {
                email = val;
            }
        }
    }

    return { name, email, phone, dogName, address };
}

/**
 * Format a raw answer value into a readable string.
 */
function formatAnswer(value, field) {
    if (value == null || value === '') return '';
    const options = field.options || [];

    if (field.field_type === 'radio' && options.length > 0) {
        const match = options.find(opt => opt.value === value);
        return match ? match.label : String(value);
    }
    if (field.field_type === 'checkbox' && Array.isArray(value)) {
        return value.map(v => {
            const match = options.find(opt => opt.value === v);
            return match ? match.label : String(v);
        }).join('、');
    }
    if (Array.isArray(value)) return value.join('、');
    return String(value);
}

/**
 * Build Notion block children for the full questionnaire Q&A.
 */
function buildQABlocks(sections, responses) {
    const children = [];

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        children.push({
            object: 'block', type: 'heading_2',
            heading_2: { rich_text: [{ type: 'text', text: { content: section.title || `第 ${i + 1} 部分` } }] },
        });

        for (const field of section.fields || []) {
            const answer = formatAnswer(responses[String(field.id)], field);
            children.push({
                object: 'block', type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: field.label }, annotations: { bold: true } }] },
            });
            children.push({
                object: 'block', type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: answer || '（未填寫）' } }] },
            });
        }

        if (i < sections.length - 1) {
            children.push({ object: 'block', type: 'divider', divider: {} });
        }
    }

    return children;
}

/**
 * Build booking info blocks to append after payment.
 */
function buildBookingBlocks(options) {
    const blocks = [
        { object: 'block', type: 'divider', divider: {} },
        { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '預約資訊' } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [
            { type: 'text', text: { content: '預約日期：' }, annotations: { bold: true } },
            { type: 'text', text: { content: options.slotDate || '' } },
        ] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [
            { type: 'text', text: { content: '預約時間：' }, annotations: { bold: true } },
            { type: 'text', text: { content: options.slotTime || '' } },
        ] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [
            { type: 'text', text: { content: '訂單編號：' }, annotations: { bold: true } },
            { type: 'text', text: { content: options.merchantTradeNo || '' } },
        ] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [
            { type: 'text', text: { content: '金額：' }, annotations: { bold: true } },
            { type: 'text', text: { content: `NT$${options.price || 0}` } },
        ] } },
    ];

    if (options.meetLink) {
        blocks.push({
            object: 'block', type: 'paragraph', paragraph: { rich_text: [
                { type: 'text', text: { content: 'Google Meet：' }, annotations: { bold: true } },
                { type: 'text', text: { content: options.meetLink, link: { url: options.meetLink } } },
            ] },
        });
    }

    return blocks;
}

/** Shared fetch helper for Notion API */
async function notionFetch(path, { method = 'GET', body } = {}) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) throw new Error('Notion API key not configured');

    const res = await fetch(`${NOTION_API}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Notion API failed (${path}): ${err}`);
    }

    return res.json();
}

// --- Phase 1: Create Page at Questionnaire Completion ---

export async function createCustomerPage(formSections, formResponses) {
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;
    if (!dbId) throw new Error('Notion Customer DB not configured');

    const customer = extractCustomerFromForm(formSections, formResponses);

    const properties = {
        '客戶姓名': { title: [{ text: { content: customer.name || '未提供姓名' } }] },
        '聯絡Email': { email: customer.email || null },
        '聯絡手機號碼 Mobile number ': { rich_text: [{ text: { content: customer.phone || '' } }] },
        '狗狗名字 Name of your lovely dog': { rich_text: [{ text: { content: customer.dogName || '' } }] },
        '地址': { rich_text: [{ text: { content: customer.address || '' } }] },
        '付款狀態': { status: { name: '未付款' } },
    };

    const children = buildQABlocks(formSections, formResponses);

    const page = await notionFetch('/pages', {
        method: 'POST',
        body: {
            parent: { database_id: dbId },
            properties,
            children: children.length > 0 ? children : undefined,
        },
    });

    console.log('[notion-crm] Created customer page:', page.id);
    return { pageId: page.id, url: page.url };
}

// --- Phase 2: Update Page After Payment Success ---

export async function updateCustomerPayment(pageId, options) {
    const serviceInfo = SERVICE_NOTION_MAP[options.serviceId] || SERVICE_NOTION_MAP['online-consult'];

    const properties = {
        '付款狀態': { status: { name: '已付款' } },
        '付費服務類別': { multi_select: [{ name: options.serviceCategory || serviceInfo.label }] },
        '訂單編號': { rich_text: [{ type: 'text', text: { content: options.merchantTradeNo || '' } }] },
        '購買課堂數': { number: serviceInfo.sessions },
        '剩餘課堂數': { number: serviceInfo.sessions },
        '單堂課報價': { rich_text: [{ text: { content: String(serviceInfo.unitPrice) } }] },
        '課程金額': { number: options.price || 0 },
    };

    await notionFetch(`/pages/${pageId}`, {
        method: 'PATCH',
        body: { properties },
    });

    const bookingBlocks = buildBookingBlocks(options);
    await notionFetch(`/blocks/${pageId}/children`, {
        method: 'PATCH',
        body: { children: bookingBlocks },
    });

    console.log('[notion-crm] Updated payment status for page:', pageId);
    return { pageId };
}

// --- Fallback: Create page with 已付款 status ---

export async function createCustomerPageWithPayment(bookingData) {
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;
    if (!dbId) throw new Error('Notion Customer DB not configured');

    const serviceInfo = SERVICE_NOTION_MAP[bookingData.serviceId] || SERVICE_NOTION_MAP['online-consult'];

    const properties = {
        '客戶姓名': { title: [{ text: { content: bookingData.customerName || '未提供姓名' } }] },
        '聯絡Email': { email: bookingData.email || null },
        '聯絡手機號碼 Mobile number ': { rich_text: [{ text: { content: bookingData.phone || '' } }] },
        '狗狗名字 Name of your lovely dog': { rich_text: [{ text: { content: bookingData.dogName || '' } }] },
        '付款狀態': { status: { name: '已付款' } },
        '付費服務類別': { multi_select: [{ name: serviceInfo.label }] },
    };

    const children = [];
    if (bookingData.formSections && bookingData.formResponses) {
        children.push(...buildQABlocks(bookingData.formSections, bookingData.formResponses));
    }
    children.push(...buildBookingBlocks(bookingData));

    const page = await notionFetch('/pages', {
        method: 'POST',
        body: {
            parent: { database_id: dbId },
            properties,
            children: children.length > 0 ? children : undefined,
        },
    });

    console.log('[notion-crm] Created customer page with payment:', page.id);
    return { pageId: page.id, url: page.url };
}

/**
 * Create an order in the Notion 訂單管理 DB after successful payment.
 */
export async function createNotionOrder(bookingData, customerPageId) {
    const orderDbId = process.env.NOTION_ORDER_DB_ID;
    if (!orderDbId) throw new Error('Notion Order DB not configured');

    const serviceInfo = SERVICE_NOTION_MAP[bookingData.serviceId] || SERVICE_NOTION_MAP['online-consult'];

    const properties = {
        '訂單編號': { title: [{ text: { content: bookingData.merchantTradeNo || '' } }] },
        '付款狀態': { status: { name: '已付款' } },
        '訂單狀態': { status: { name: '已確認' } },
        '購買課堂數': { number: serviceInfo.sessions },
        '剩餘課堂數': { number: serviceInfo.sessions },
        '單堂課報價': { number: serviceInfo.unitPrice },
        '訂單金額': { rich_text: [{ text: { content: String(bookingData.price || 0) } }] },
        '匯款日期': { date: { start: new Date().toISOString().split('T')[0] } },
    };

    if (bookingData.slotDate) {
        properties['開始日期'] = { date: { start: bookingData.slotDate } };
    }

    if (customerPageId) {
        properties['客戶姓名'] = { relation: [{ id: customerPageId }] };
    }

    // Look up service page ID for relation
    const serviceDbId = process.env.NOTION_SERVICE_DB_ID;
    if (serviceDbId) {
        try {
            const searchData = await notionFetch(`/databases/${serviceDbId}/query`, {
                method: 'POST',
                body: {
                    filter: { property: '代碼', rich_text: { equals: bookingData.serviceId || 'single-session' } },
                    page_size: 1,
                },
            });
            if (searchData.results.length > 0) {
                properties['服務項目'] = { relation: [{ id: searchData.results[0].id }] };
            }
        } catch (err) {
            console.warn('[createNotionOrder] Could not look up service page:', err.message);
        }
    }

    const page = await notionFetch('/pages', {
        method: 'POST',
        body: { parent: { database_id: orderDbId }, properties },
    });

    console.log('[notion-crm] Created order:', page.id);
    return { pageId: page.id };
}
