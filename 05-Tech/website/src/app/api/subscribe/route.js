import { NextResponse } from 'next/server';
import { generateConfirmationToken } from '@/lib/email-token';

/**
 * POST /api/subscribe
 * Body: { email: string }
 *
 * Double Opt-in flow:
 * 1. Creates a Ghost Member via the Admin API
 * 2. Sends a confirmation email (NOT the welcome email)
 * 3. User clicks confirmation link → /api/subscribe/confirm → welcome email
 */
export async function POST(request) {
    try {
        const { email } = await request.json();

        // Basic validation
        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: '請輸入有效的 Email 地址' }, { status: 400 });
        }

        const GHOST_URL = process.env.GHOST_URL;
        const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY;

        // If Ghost Admin API is not configured, return dev mode
        if (!GHOST_URL || !GHOST_ADMIN_API_KEY || GHOST_ADMIN_API_KEY.includes('placeholder')) {
            console.log(`[DEV] Ghost Admin API not configured. Would subscribe: ${email}`);
            return NextResponse.json({ success: true, dev: true });
        }

        // Build Ghost Admin API JWT token
        const [id, secret] = GHOST_ADMIN_API_KEY.split(':');

        const { createHmac } = await import('crypto');
        const now = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
        const signature = createHmac('sha256', Buffer.from(secret, 'hex'))
            .update(`${header}.${payload}`)
            .digest('base64url');
        const token = `${header}.${payload}.${signature}`;

        // First, get available newsletters to find the correct newsletter ID
        const newslettersRes = await fetch(`${GHOST_URL}/ghost/api/admin/newsletters/?limit=all`, {
            headers: {
                Authorization: `Ghost ${token}`,
                'Accept-Version': 'v5.0',
            },
        });

        let newsletterPayload = [];
        if (newslettersRes.ok) {
            const newslettersData = await newslettersRes.json();
            newsletterPayload = (newslettersData.newsletters || [])
                .filter((n) => n.status === 'active')
                .map((n) => ({ id: n.id }));
        }

        // Create member in Ghost via Admin API
        const memberBody = {
            members: [
                {
                    email,
                    subscribed: true,
                    labels: [{ name: '官網訂閱' }, { name: '待確認' }],
                    ...(newsletterPayload.length > 0 ? { newsletters: newsletterPayload } : {}),
                },
            ],
        };

        const res = await fetch(`${GHOST_URL}/ghost/api/admin/members/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Ghost ${token}`,
                'Accept-Version': 'v5.0',
            },
            body: JSON.stringify(memberBody),
        });

        if (res.ok) {
            console.log(`✅ New Ghost member created (pending confirmation): ${email}`);
        } else {
            const errorData = await res.json();
            // Handle duplicate email gracefully
            if (
                errorData?.errors?.[0]?.type === 'ValidationError' ||
                errorData?.errors?.[0]?.message?.includes('already exists')
            ) {
                console.log(`ℹ️ Member already exists: ${email}`);
                return NextResponse.json({ success: true, alreadySubscribed: true });
            }
            console.error('Ghost Admin API error:', JSON.stringify(errorData));
            return NextResponse.json({ error: '訂閱時發生錯誤，請稍後再試' }, { status: 500 });
        }

        // Send confirmation email (Double Opt-in)
        try {
            await sendConfirmationEmail(email);
        } catch (mailErr) {
            console.error('Confirmation email failed (non-blocking):', mailErr?.message || mailErr);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Subscribe API error:', err);
        return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
    }
}

/**
 * Send a confirmation email for Double Opt-in.
 * Uses near-plaintext style (Strategy B) to land in Primary inbox.
 */
async function sendConfirmationEmail(recipientEmail) {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'doriritohappydays.com';

    if (!MAILGUN_API_KEY) {
        console.warn('Mailgun API key not set — skipping confirmation email');
        return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';

    // Generate HMAC-based confirmation token
    const { token, expires } = generateConfirmationToken(recipientEmail);
    const confirmUrl = `${siteUrl}/api/subscribe/confirm?email=${encodeURIComponent(recipientEmail)}&expires=${expires}&token=${token}`;

    const fromAddress = `Dori & Rito Happydays <hello@${MAILGUN_DOMAIN}>`;
    const subject = '嗨，請確認你的訂閱 — Dori & Rito Happydays';

    // Plain text version
    const textBody = `嗨～

感謝你訂閱 Dori & Rito Happydays 電子報！

請點擊以下連結確認你的訂閱：
${confirmUrl}

確認後，我們每週會和你分享在陪伴毛孩的過程中，可以用哪些心態和方法來調整毛孩的行為，一起打造你與毛孩的理想生活。

如果你沒有訂閱，請忽略這封信。

Dori & Rito Happydays
`;

    // Near-plaintext HTML version (Strategy B — minimal styling)
    const htmlBody = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;font-family:'Helvetica Neue',Arial,sans-serif;background-color:#ffffff;color:#333333;line-height:1.8;font-size:16px;">
<div style="max-width:580px;margin:0 auto;">

<p>嗨～</p>

<p>感謝你訂閱 Dori & Rito Happydays 電子報！</p>

<p>請點擊以下連結確認你的訂閱：<br>
<a href="${confirmUrl}" style="color:#c5a97a;">確認訂閱</a></p>

<p>確認後，我們每週會和你分享在陪伴毛孩的過程中，可以用哪些心態和方法來調整毛孩的行為，一起打造你與毛孩的理想生活。</p>

<p style="color:#999;font-size:14px;">如果你沒有訂閱，請忽略這封信。</p>

<p style="margin-top:24px;">Dori & Rito Happydays</p>

</div>
</body>
</html>`;

    const form = new URLSearchParams();
    form.append('from', fromAddress);
    form.append('to', recipientEmail);
    form.append('subject', subject);
    form.append('html', htmlBody);
    form.append('text', textBody);
    form.append('h:Reply-To', 'dori.rito.happydays@gmail.com');
    form.append('o:tag', 'confirmation-email');
    form.append('o:tracking', 'no');
    form.append('o:tracking-clicks', 'no');
    form.append('o:tracking-opens', 'no');

    const mgRes = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
        },
        body: form,
    });

    if (mgRes.ok) {
        console.log(`📧 Confirmation email sent to: ${recipientEmail}`);
    } else {
        const errText = await mgRes.text();
        console.error(`❌ Mailgun confirmation email failed (${mgRes.status}):`, errText);
    }
}
