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

// --- Helpers ---

/**
 * Extract customer info from formSections + formResponses by matching field labels.
 * Reusable across both client-side and server-side code.
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

            // Fallback: match by field_type for email
            if (field.field_type === 'email' && !email) {
                email = val;
            }
        }
    }

    return { name, email, phone, dogName, address };
}

/**
 * Format a raw answer value into a readable string.
 * Handles radio (single value → option label), checkbox (array → labels joined),
 * and plain text/textarea/email.
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

    if (Array.isArray(value)) {
        return value.join('、');
    }

    return String(value);
}

/**
 * Build Notion block children for the full questionnaire Q&A.
 * Organized by section with dividers between sections.
 *
 * Output structure:
 *   ## Section Title
 *   **Question Label**
 *   Answer text
 *   (blank line)
 *   ...
 *   ---
 *   ## Next Section
 *   ...
 */
function buildQABlocks(sections, responses) {
    const children = [];

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        // Section heading
        children.push({
            object: 'block',
            type: 'heading_2',
            heading_2: {
                rich_text: [{ type: 'text', text: { content: section.title || `第 ${i + 1} 部分` } }],
            },
        });

        // Fields Q&A
        for (const field of section.fields || []) {
            const rawValue = responses[String(field.id)];
            const answer = formatAnswer(rawValue, field);

            // Question (bold) + answer on next line
            children.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: field.label },
                            annotations: { bold: true },
                        },
                    ],
                },
            });

            children.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: answer || '（未填寫）' },
                        },
                    ],
                },
            });
        }

        // Divider between sections (except after the last one)
        if (i < sections.length - 1) {
            children.push({
                object: 'block',
                type: 'divider',
                divider: {},
            });
        }
    }

    return children;
}

// --- Phase 1: Create Page at Questionnaire Completion ---

/**
 * Create a customer page in the Notion Customer DB at questionnaire completion.
 * Page includes full Q&A content and 付款狀態 = "未付款".
 *
 * @param {Array} formSections - Form sections with fields + options
 * @param {object} formResponses - { [fieldId]: value }
 * @returns {{ pageId: string, url: string }}
 */
export async function createCustomerPage(formSections, formResponses) {
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;

    if (!apiKey || !dbId) {
        throw new Error('Notion credentials not configured');
    }

    // Extract customer info from form responses
    const customer = extractCustomerFromForm(formSections, formResponses);

    // Build properties matching exact Notion DB schema
    const properties = {
        '客戶姓名': {
            title: [{ text: { content: customer.name || '未提供姓名' } }],
        },
        '聯絡Email': {
            email: customer.email || null,
        },
        // ⚠️ Trailing space in actual DB property name
        '聯絡手機號碼 Mobile number ': {
            rich_text: [{ text: { content: customer.phone || '' } }],
        },
        '狗狗名字 Name of your lovely dog': {
            rich_text: [{ text: { content: customer.dogName || '' } }],
        },
        '地址': {
            rich_text: [{ text: { content: customer.address || '' } }],
        },
        '付款狀態': {
            status: { name: '未付款' },
        },
    };

    // Build Q&A page content
    const children = buildQABlocks(formSections, formResponses);

    const res = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        body: JSON.stringify({
            parent: { database_id: dbId },
            properties,
            children: children.length > 0 ? children : undefined,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Notion API failed (create): ${err}`);
    }

    const page = await res.json();
    console.log('[notion-crm] Created customer page:', page.id);
    return { pageId: page.id, url: page.url };
}

// --- Phase 2: Update Page After Payment Success ---

/**
 * Update an existing customer page after successful payment.
 * Sets 付款狀態 = "已付款", 付費服務類別, and appends booking info.
 *
 * @param {string} pageId - Notion page ID from createCustomerPage
 * @param {object} options
 * @param {string} options.serviceName - e.g. "1對1 線上諮詢"
 * @param {string} options.serviceCategory - Notion multi_select value, e.g. "1對1_線上諮詢"
 * @param {string} options.slotDate - YYYY-MM-DD
 * @param {string} options.slotTime - HH:mm
 * @param {number} options.price
 * @param {string} options.merchantTradeNo
 * @param {string} [options.meetLink]
 */
export async function updateCustomerPayment(pageId, options) {
    const apiKey = process.env.NOTION_API_KEY;

    if (!apiKey) {
        throw new Error('Notion API key not configured');
    }

    // 1. Update page properties
    const properties = {
        '付款狀態': {
            status: { name: '已付款' },
        },
        '付費服務類別': {
            multi_select: [{ name: options.serviceCategory || '1對1_線上諮詢' }],
        },
        '訂單編號': {
            rich_text: [{ type: 'text', text: { content: options.merchantTradeNo || '' } }],
        },
    };

    const patchRes = await fetch(`${NOTION_API}/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        body: JSON.stringify({ properties }),
    });

    if (!patchRes.ok) {
        const err = await patchRes.text();
        throw new Error(`Notion API failed (update properties): ${err}`);
    }

    // 2. Append booking info blocks to the page
    const bookingBlocks = [
        {
            object: 'block',
            type: 'divider',
            divider: {},
        },
        {
            object: 'block',
            type: 'heading_2',
            heading_2: {
                rich_text: [{ type: 'text', text: { content: '預約資訊' } }],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '預約日期：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: options.slotDate || '' } },
                ],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '預約時間：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: options.slotTime || '' } },
                ],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '訂單編號：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: options.merchantTradeNo || '' } },
                ],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '金額：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: `NT$${options.price || 0}` } },
                ],
            },
        },
    ];

    if (options.meetLink) {
        bookingBlocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: 'Google Meet：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: options.meetLink, link: { url: options.meetLink } } },
                ],
            },
        });
    }

    const appendRes = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        body: JSON.stringify({ children: bookingBlocks }),
    });

    if (!appendRes.ok) {
        const err = await appendRes.text();
        throw new Error(`Notion API failed (append blocks): ${err}`);
    }

    console.log('[notion-crm] Updated payment status for page:', pageId);
    return { pageId };
}

// --- Fallback: Create page with 已付款 status (when notionPageId is missing) ---

/**
 * Create a customer page directly with 已付款 status.
 * Used as fallback when notionPageId was not captured at questionnaire time.
 *
 * @param {object} bookingData - Full booking data from webhook
 * @returns {{ pageId: string, url: string }}
 */
export async function createCustomerPageWithPayment(bookingData) {
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_CUSTOMER_DB_ID;

    if (!apiKey || !dbId) {
        throw new Error('Notion credentials not configured');
    }

    const properties = {
        '客戶姓名': {
            title: [{ text: { content: bookingData.customerName || '未提供姓名' } }],
        },
        '聯絡Email': {
            email: bookingData.email || null,
        },
        '聯絡手機號碼 Mobile number ': {
            rich_text: [{ text: { content: bookingData.phone || '' } }],
        },
        '狗狗名字 Name of your lovely dog': {
            rich_text: [{ text: { content: bookingData.dogName || '' } }],
        },
        '付款狀態': {
            status: { name: '已付款' },
        },
        '付費服務類別': {
            multi_select: [{ name: '1對1_線上諮詢' }],
        },
    };

    // Build Q&A content if form data available
    const children = [];
    if (bookingData.formSections && bookingData.formResponses) {
        children.push(...buildQABlocks(bookingData.formSections, bookingData.formResponses));
    }

    // Append booking info
    children.push(
        { object: 'block', type: 'divider', divider: {} },
        {
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ type: 'text', text: { content: '預約資訊' } }] },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '預約日期：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: bookingData.slotDate || '' } },
                ],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '預約時間：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: bookingData.slotTime || '' } },
                ],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '訂單編號：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: bookingData.merchantTradeNo || '' } },
                ],
            },
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '金額：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: `NT$${bookingData.price || 0}` } },
                ],
            },
        },
    );

    if (bookingData.meetLink) {
        children.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: 'Google Meet：' }, annotations: { bold: true } },
                    { type: 'text', text: { content: bookingData.meetLink, link: { url: bookingData.meetLink } } },
                ],
            },
        });
    }

    const res = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        body: JSON.stringify({
            parent: { database_id: dbId },
            properties,
            children: children.length > 0 ? children : undefined,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Notion API failed (create with payment): ${err}`);
    }

    const page = await res.json();
    console.log('[notion-crm] Created customer page with payment:', page.id);
    return { pageId: page.id, url: page.url };
}
