import { NextResponse } from 'next/server';
import { verifyConfirmationToken } from '@/lib/email-token';

/**
 * GET /api/subscribe/confirm?email=xxx&expires=xxx&token=xxx
 *
 * Verifies the Double Opt-in token, updates the Ghost member label,
 * sends the welcome email, and redirects to the thank-you page.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const expires = parseInt(searchParams.get('expires'), 10);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';

    // Validate parameters
    if (!email || !token || !expires) {
        return NextResponse.redirect(`${siteUrl}/thank-you?status=invalid`);
    }

    // Verify token
    const result = verifyConfirmationToken(email, token, expires);
    if (!result.valid) {
        return NextResponse.redirect(`${siteUrl}/thank-you?status=${result.reason}`);
    }

    try {
        // Update Ghost member: add「已確認」label (returns false if already confirmed)
        const isFirstConfirmation = await updateGhostMemberLabel(email);

        // Only send welcome email on the FIRST confirmation (idempotency guard)
        if (isFirstConfirmation) {
            await sendWelcomeEmail(email);
        }

        return NextResponse.redirect(`${siteUrl}/thank-you?status=success`);
    } catch (err) {
        console.error('Confirmation error:', err);
        return NextResponse.redirect(`${siteUrl}/thank-you?status=error`);
    }
}

/**
 * Update Ghost member to add「已確認」label.
 * Returns true if this is the FIRST confirmation (label was newly added),
 * false if the member was already confirmed (idempotency guard).
 */
async function updateGhostMemberLabel(email) {
    const GHOST_URL = process.env.GHOST_URL;
    const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY;

    if (!GHOST_URL || !GHOST_ADMIN_API_KEY) return true; // No Ghost → send email anyway

    const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
    const { createHmac } = await import('crypto');
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
    const signature = createHmac('sha256', Buffer.from(secret, 'hex'))
        .update(`${header}.${payload}`)
        .digest('base64url');
    const token = `${header}.${payload}.${signature}`;

    // Find the member by email
    const searchRes = await fetch(
        `${GHOST_URL}/ghost/api/admin/members/?filter=email:'${encodeURIComponent(email)}'`,
        {
            headers: {
                Authorization: `Ghost ${token}`,
                'Accept-Version': 'v5.0',
            },
        }
    );

    if (!searchRes.ok) {
        console.error('Ghost member search failed:', await searchRes.text());
        return true; // Ghost error → send email as fallback
    }

    const searchData = await searchRes.json();
    const member = searchData?.members?.[0];
    if (!member) {
        console.warn(`Member not found for email: ${email}`);
        return true; // Member missing → send email anyway
    }

    // Idempotency check: if already confirmed, skip welcome email
    const existingLabels = (member.labels || []).map((l) => ({ name: l.name }));
    if (existingLabels.some((l) => l.name === '已確認')) {
        console.log(`⏭️ Already confirmed, skipping welcome email: ${email}`);
        return false;
    }

    // First confirmation — add「已確認」label
    const updatedLabels = [...existingLabels.map((l) => ({ name: l.name })), { name: '已確認' }];

    const updateRes = await fetch(`${GHOST_URL}/ghost/api/admin/members/${member.id}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Ghost ${token}`,
            'Accept-Version': 'v5.0',
        },
        body: JSON.stringify({
            members: [{ labels: updatedLabels }],
        }),
    });

    if (updateRes.ok) {
        console.log(`✅ Ghost member confirmed: ${email}`);
    } else {
        console.error('Ghost member update failed:', await updateRes.text());
    }

    return true; // First confirmation → send welcome email
}

/**
 * Send the welcome email (post-confirmation) via Mailgun.
 * Uses a personal, near-plaintext style (Strategy B) to land in Primary inbox.
 */
async function sendWelcomeEmail(recipientEmail) {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'doriritohappydays.com';

    if (!MAILGUN_API_KEY) {
        console.warn('Mailgun API key not set — skipping welcome email');
        return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';
    const fromAddress = `Dori & Rito Happydays <hello@${MAILGUN_DOMAIN}>`;
    const subject = '歡迎加入Dori & Rito Happydays電子報社群，一起打造你與毛孩的理想生活！';

    const textBody = `嗨！

感謝你訂閱 Dori & Rito Happydays 電子報！

從現在起，我們每週會和你分享：
- 在陪伴毛孩的過程中，可以用哪些心態和方法來調整毛孩的行為
- 解決吠叫、焦慮、暴衝、啃咬等常見問題的具體步驟
- 提升毛孩生活的科學資訊

一起打造你與毛孩的理想生活 🐶

Dori & Rito Happydays

---
官方網站：https://doriritohappydays.com
Instagram：https://www.instagram.com/dori.rito.happydays/

你收到這封信是因為你確認訂閱了我們的電子報。
`;

    const htmlBody = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;font-family:'Helvetica Neue',Arial,sans-serif;background-color:#ffffff;color:#333333;line-height:1.8;font-size:16px;">
<div style="max-width:580px;margin:0 auto;">

<p>嗨！</p>

<p>感謝你訂閱 Dori & Rito Happydays 電子報！</p>

<p>從現在起，我們每週會和你分享：</p>
<ul style="padding-left:20px;color:#333;">
<li>在陪伴毛孩的過程中，可以用哪些心態和方法來調整毛孩的行為</li>
<li>解決吠叫、焦慮、暴衝、啃咬等常見問題的具體步驟</li>
<li>提升毛孩生活的科學資訊</li>
</ul>

<p>一起打造你與毛孩的理想生活 🐶</p>

<p style="margin-top:24px;">Dori & Rito Happydays</p>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
<p style="font-size:13px;color:#999;">
<a href="https://doriritohappydays.com" style="color:#999;">官方網站</a> ｜
<a href="https://www.instagram.com/dori.rito.happydays/" style="color:#999;">Instagram</a><br>
你收到這封信是因為你確認訂閱了我們的電子報。
</p>

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
    form.append('o:tag', 'welcome-email');
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
        console.log(`📧 Welcome email sent to: ${recipientEmail}`);
    } else {
        const errText = await mgRes.text();
        console.error(`❌ Mailgun welcome email failed (${mgRes.status}):`, errText);
    }
}
