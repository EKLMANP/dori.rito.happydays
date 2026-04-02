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
 * 發送感謝 Email 給合作洽詢者
 */
async function sendThankYouEmail({ name, email }) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const baseUrl = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net';
    if (!apiKey || !domain) {
        console.log('[DEV] Mailgun not configured, skipping thank-you email');
        return;
    }

    const subject = `【Dori & Rito Happydays】感謝您的合作提案 - ${name}`;
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
    <tr><td align="center" style="padding:20px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:30px;font-size:16px;line-height:1.8;color:#333;">
          <p>${name} 您好，</p>
          <p>感謝您對 <strong>Dori & Rito Happydays</strong> 的合作興趣！</p>
          <p>我們已收到您的合作提案，團隊會在 <strong>3 個工作天</strong>內回覆您。<br/>如有任何急需，歡迎直接來信 <a href="mailto:dori.rito.happydays@gmail.com" style="color:#2563eb;">dori.rito.happydays@gmail.com</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
          <p style="font-size:14px;color:#666;">
            🌐 <a href="https://doriritohappydays.com" style="color:#2563eb;">官網</a>&nbsp;&nbsp;|&nbsp;&nbsp;
            📸 <a href="https://www.instagram.com/dori_rito_happydays/" style="color:#2563eb;">Instagram</a>
          </p>
          <p style="margin-top:24px;">Dori & Rito Happydays 團隊敬上</p>
        </td></tr>
        <tr><td style="padding:20px 30px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;">
          &copy; ${new Date().getFullYear()} Dori &amp; Rito Happydays &mdash; 正向訓犬<br/>
          <a href="https://doriritohappydays.com" style="color:#999;">doriritohappydays.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const formData = new URLSearchParams();
    formData.append('from', `Dori & Rito Happydays <noreply@${domain}>`);
    formData.append('to', email);
    formData.append('subject', subject);
    formData.append('html', html);
    formData.append('h:Reply-To', 'dori.rito.happydays@gmail.com');

    try {
        const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
            },
            body: formData,
        });
        if (!res.ok) {
            console.error('Thank-you email failed:', await res.text());
        } else {
            console.log('✅ 感謝 Email 已發送給', email);
        }
    } catch (err) {
        console.error('Thank-you email error:', err);
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
            sendThankYouEmail(formData),
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
