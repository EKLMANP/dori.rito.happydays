/**
 * Post-Payment Automation — Event Dispatcher Pattern
 *
 * Each handler is independent; one failure won't block others.
 * To add a new integration: import it and add to the handlers array.
 */

import { sql } from '@/lib/db';
import { renderEmailTemplate, renderSubject } from '@/lib/email-renderer';
import { updateCustomerPayment, createCustomerPageWithPayment } from '@/lib/notion-crm';
import { createEvent } from '@/lib/google-calendar';

// --- Active Handlers ---

async function notifyEmail(bookingData) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domain) {
        console.warn('[notifyEmail] Mailgun not configured, skipping');
        return;
    }

    // Load template from DB
    const templates = await sql`SELECT * FROM email_templates WHERE id = 'booking-confirmation'`;
    if (templates.length === 0) {
        console.warn('[notifyEmail] No booking-confirmation template found');
        return;
    }
    const template = templates[0];

    const data = {
        customer_name: bookingData.customerName,
        dog_name: bookingData.dogName,
        service_name: bookingData.serviceName,
        slot_date: bookingData.slotDate,
        slot_time: bookingData.slotTime,
        price: bookingData.price,
        order_no: bookingData.merchantTradeNo,
        meet_link: bookingData.meetLink || '',
    };

    const html = renderEmailTemplate(template, data);
    const subject = renderSubject(template, data);

    const form = new URLSearchParams();
    form.append('from', `Dori & Rito Happydays <noreply@${domain}>`);
    form.append('to', bookingData.email);
    form.append('subject', subject);
    form.append('html', html);
    form.append('h:Reply-To', 'dori.rito.happydays@gmail.com');

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` },
        body: form,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Mailgun send failed: ${err}`);
    }
    console.log('[notifyEmail] Confirmation sent to', bookingData.email);
}

async function notifyTelegram(bookingData) {
    const botToken = process.env.DR_FNACC_BOT_TOKEN;
    const groups = [
        process.env.DR_CS_GROUP_CHAT_ID,
        process.env.DR_FN_GROUP_CHAT_ID,
    ].filter(Boolean);

    if (!botToken || groups.length === 0) {
        console.warn('[notifyTelegram] Telegram not configured, skipping');
        return;
    }

    const text = [
        '🔔 *新預約成功*',
        `客戶：${bookingData.customerName}`,
        `狗狗：${bookingData.dogName}`,
        `服務：${bookingData.serviceName}`,
        `時間：${bookingData.slotDate} ${bookingData.slotTime}`,
        `金額：NT$${bookingData.price}`,
        `訂單：${bookingData.merchantTradeNo}`,
    ].join('\n');

    for (const chatId of groups) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown',
            }),
        });
    }
}

async function createNotionCRM(bookingData) {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_CUSTOMER_DB_ID) {
        console.warn('[createNotionCRM] Notion not configured, skipping');
        return;
    }

    const paymentOptions = {
        serviceName: bookingData.serviceName,
        serviceCategory: '1對1_線上諮詢',
        slotDate: bookingData.slotDate,
        slotTime: bookingData.slotTime,
        price: bookingData.price,
        merchantTradeNo: bookingData.merchantTradeNo,
        meetLink: bookingData.meetLink,
    };

    if (bookingData.notionPageId) {
        // Phase 2: Page already exists from questionnaire submission — update it
        const result = await updateCustomerPayment(bookingData.notionPageId, paymentOptions);
        console.log('[createNotionCRM] Updated existing page:', result.pageId);
    } else {
        // Fallback: notionPageId missing (e.g. questionnaire-submit failed) — create fresh
        console.warn('[createNotionCRM] No notionPageId, creating page with payment directly');
        const result = await createCustomerPageWithPayment(bookingData);
        console.log('[createNotionCRM] Created page with payment:', result.pageId);
    }
}

async function createGCalEvent(bookingData) {
    if (!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
        console.warn('[createGCalEvent] Google Calendar not configured, skipping');
        return;
    }

    const startDateTime = `${bookingData.slotDate}T${bookingData.slotTime}:00+08:00`;
    // Calculate end time from service duration (default 60 min)
    const durationMin = bookingData.duration || 60;
    const [startH, startM] = bookingData.slotTime.split(':').map(Number);
    const totalMin = startH * 60 + startM + durationMin;
    const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const endM = String(totalMin % 60).padStart(2, '0');
    const endDateTime = `${bookingData.slotDate}T${endH}:${endM}:00+08:00`;

    const description = [
        `客戶：${bookingData.customerName}`,
        `狗狗：${bookingData.dogName}`,
        `Email：${bookingData.email}`,
        `電話：${bookingData.phone || ''}`,
        `訂單：${bookingData.merchantTradeNo}`,
    ].join('\n');

    const attendeeEmails = [bookingData.email].filter(Boolean);

    const result = await createEvent({
        summary: `${bookingData.serviceName} - ${bookingData.customerName}`,
        description,
        startDateTime,
        endDateTime,
        attendeeEmails,
    });

    // Store meetLink on bookingData for downstream handlers (e.g. Notion, email)
    bookingData.meetLink = result.meetLink;
    console.log('[createGCalEvent] Created event:', result.eventId, 'Meet:', result.meetLink);
}

// --- Handler Registry ---
// Add new integrations here. Each must be async (bookingData) => void.

const handlers = [
    createGCalEvent,   // First: creates Meet link needed by other handlers
    notifyEmail,
    notifyTelegram,
    createNotionCRM,
    // --- Future Integrations (uncomment to enable) ---
    // notifySlack,
    // syncHubSpot,
    // triggerZapier,
    // notifyLineOA,
    // postInstagram,
];

/**
 * Execute all post-payment automations.
 * Each handler runs independently — failures are logged but don't block others.
 *
 * @param {object} bookingData - Booking details from payment webhook
 * @returns {object} Results summary { succeeded: string[], failed: { name, error }[] }
 */
export async function runBookingAutomations(bookingData) {
    const succeeded = [];
    const failed = [];

    for (const handler of handlers) {
        try {
            await handler(bookingData);
            succeeded.push(handler.name);
        } catch (err) {
            console.error(`[booking-automations] ${handler.name} failed:`, err);
            failed.push({ name: handler.name, error: err.message });
        }
    }

    console.log(
        `[booking-automations] Done: ${succeeded.length} succeeded, ${failed.length} failed`
    );
    return { succeeded, failed };
}
