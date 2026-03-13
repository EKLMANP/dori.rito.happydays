import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const NOTION_LINK = 'https://tinyurl.com/y25e79se';

/**
 * 發送 Telegram 通知到 DR_MKT Team 群組
 */
async function sendTelegramNotification({ name, message }) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_DR_MKT_TEAM;
    if (!botToken || !chatId) {
        console.log('[DEV] Telegram not configured, skipping notification');
        return;
    }

    const today = new Date().toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Taipei',
    });

    const text = [
        `有來自 ${name} 新的「合作洽詢」囉！`,
        '',
        `• 日期：${today}`,
        `• 姓名：${name}`,
        `• 關於合作的想法：${message || '（未填寫）'}`,
        `• 詳見Notion：${NOTION_LINK}`,
    ].join('\n');

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
        });
        if (!res.ok) {
            console.error('Telegram notification failed:', await res.text());
        } else {
            console.log('✅ Telegram 通知已發送');
        }
    } catch (err) {
        console.error('Telegram notification error:', err);
    }
}

/**
 * 透過 Mailgun API 發送 Email 通知
 */
async function sendEmailNotification({ name, email, phone, types, message }) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const baseUrl = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net';
    if (!apiKey || !domain) {
        console.log('[DEV] Mailgun not configured, skipping email notification');
        return;
    }

    const today = new Date().toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Taipei',
    });

    const subject = `有來自 ${name} 新的「合作洽詢」囉！`;
    const body = [
        `日期：${today}`,
        `姓名：${name}`,
        `聯絡Email：${email}`,
        `聯絡電話：${phone || '（未填寫）'}`,
        `合作類型：${types?.length ? types.join('、') : '（未選擇）'}`,
        `關於合作的想法：${message || '（未填寫）'}`,
        '',
        `詳見Notion：${NOTION_LINK}`,
    ].join('\n');

    const formData = new URLSearchParams();
    formData.append('from', `Dori & Rito 官網 <noreply@${domain}>`);
    formData.append('to', 'dori.rito.happydays@gmail.com');
    formData.append('subject', subject);
    formData.append('text', body);

    try {
        const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
            },
            body: formData,
        });
        if (!res.ok) {
            console.error('Email notification failed:', await res.text());
        } else {
            console.log('✅ Email 通知已發送');
        }
    } catch (err) {
        console.error('Email notification error:', err);
    }
}

/**
 * POST /api/contact
 * Body: { name, phone, email, types[], message }
 *
 * 合作洽詢表單 → 寫入 Notion + 發送 Telegram & Email 通知
 */
export async function POST(request) {
    try {
        const { name, phone, email, types, message } = await request.json();

        // 基本驗證
        if (!name || !name.trim()) {
            return NextResponse.json({ error: '請輸入您的稱呼' }, { status: 400 });
        }
        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: '請輸入有效的 Email 地址' }, { status: 400 });
        }

        const NOTION_API_KEY = process.env.NOTION_API_KEY;
        const NOTION_DB_ID = process.env.NOTION_CONTACT_DB_ID;

        // DEV mode fallback
        if (!NOTION_API_KEY || !NOTION_DB_ID) {
            console.log('[DEV] Notion API not configured. Would submit:', { name, phone, email, types, message });
            return NextResponse.json({ success: true, dev: true });
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        // 洽詢日期（台北時區）
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }); // YYYY-MM-DD

        // 建立 Notion page 的 properties
        const properties = {
            '怎麼稱呼您': {
                title: [{ text: { content: name.trim() } }],
            },
            '聯絡Email': {
                email: email.trim(),
            },
            '洽詢日期': {
                date: { start: today },
            },
        };

        // 選填欄位
        if (phone && phone.trim()) {
            properties['聯絡電話'] = {
                phone_number: phone.trim(),
            };
        }

        if (types && types.length > 0) {
            properties['合作類型'] = {
                multi_select: types.map((t) => ({ name: t })),
            };
        }

        if (message && message.trim()) {
            properties['關於合作的想法'] = {
                rich_text: [{ text: { content: message.trim() } }],
            };
        }

        await notion.pages.create({
            parent: { database_id: NOTION_DB_ID },
            properties,
        });

        console.log(`✅ 合作洽詢已寫入 Notion: ${name} (${email})`);

        // 非同步發送通知（不阻塞回應）
        const formData = { name: name.trim(), email: email.trim(), phone, types, message };
        Promise.allSettled([
            sendTelegramNotification(formData),
            sendEmailNotification(formData),
        ]).then((results) => {
            results.forEach((r) => {
                if (r.status === 'rejected') console.error('Notification error:', r.reason);
            });
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Contact API error:', err);
        return NextResponse.json({ error: '送出失敗，請稍後再試' }, { status: 500 });
    }
}
