/**
 * Notion CRM Integration — Customer Database 客戶管理
 *
 * Thin wrapper over notion.js SDK functions.
 * Kept for backward compatibility with booking flow imports.
 *
 * Two-phase lifecycle:
 *   1. createCustomerPage()  — called at questionnaire completion
 *   2. updateCustomerPayment() — called after payment success
 */

import { createCustomerPageWithBlocks, updateCustomerPaymentStatus } from './notion';

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

// --- Phase 1: Create Page at Questionnaire Completion ---

export async function createCustomerPage(formSections, formResponses) {
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
    const result = await createCustomerPageWithBlocks({ properties, children });
    console.log('[notion-crm] Created customer page:', result.pageId);
    return result;
}

// --- Phase 2: Update Page After Payment Success ---

export async function updateCustomerPayment(pageId, options) {
    const properties = {
        '付款狀態': { status: { name: '已付款' } },
        '付費服務類別': { multi_select: [{ name: options.serviceCategory || '1對1_線上諮詢' }] },
        '訂單編號': { rich_text: [{ type: 'text', text: { content: options.merchantTradeNo || '' } }] },
    };

    const bookingBlocks = buildBookingBlocks(options);
    const result = await updateCustomerPaymentStatus(pageId, { properties, bookingBlocks });
    console.log('[notion-crm] Updated payment status for page:', pageId);
    return result;
}

// --- Fallback: Create page with 已付款 status ---

export async function createCustomerPageWithPayment(bookingData) {
    const properties = {
        '客戶姓名': { title: [{ text: { content: bookingData.customerName || '未提供姓名' } }] },
        '聯絡Email': { email: bookingData.email || null },
        '聯絡手機號碼 Mobile number ': { rich_text: [{ text: { content: bookingData.phone || '' } }] },
        '狗狗名字 Name of your lovely dog': { rich_text: [{ text: { content: bookingData.dogName || '' } }] },
        '付款狀態': { status: { name: '已付款' } },
        '付費服務類別': { multi_select: [{ name: '1對1_線上諮詢' }] },
    };

    const children = [];
    if (bookingData.formSections && bookingData.formResponses) {
        children.push(...buildQABlocks(bookingData.formSections, bookingData.formResponses));
    }
    children.push(...buildBookingBlocks(bookingData));

    const result = await createCustomerPageWithBlocks({ properties, children });
    console.log('[notion-crm] Created customer page with payment:', result.pageId);
    return result;
}
