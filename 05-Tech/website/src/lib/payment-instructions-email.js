/**
 * Payment Instructions Email — sent when ECPay assigns a deferred-payment code
 * (ATM virtual account, CVS code, BARCODE) but funds haven't arrived yet.
 *
 * This is the "請於期限內完成繳費" reminder. Once the customer actually pays,
 * /api/booking/notify fires and the regular booking-confirmation email is sent.
 */

function classify(paymentType) {
    if (!paymentType) return 'OTHER';
    if (paymentType.startsWith('ATM') || paymentType.startsWith('WebATM')) return 'ATM';
    if (paymentType === 'CVS' || paymentType.startsWith('CVS_')) return 'CVS';
    if (paymentType === 'BARCODE' || paymentType.startsWith('BARCODE_')) return 'BARCODE';
    return 'OTHER';
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderInstructionsBlock(paymentInfo, price) {
    const e = escapeHtml;
    const kind = classify(paymentInfo.paymentType);
    const amountRow = `
        <tr><td style="padding:8px 12px;color:#666;width:140px;">繳費金額 Amount</td>
            <td style="padding:8px 12px;font-weight:600;">NT$ ${e(price ?? '—')}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;">繳費期限 Pay Before</td>
            <td style="padding:8px 12px;color:#b45309;font-weight:600;">${e(paymentInfo.expireDate ?? '—')}</td></tr>`;

    if (kind === 'ATM') {
        return `
        <table style="width:100%;border-collapse:collapse;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
            <tr><td style="padding:8px 12px;color:#666;width:140px;">銀行代號 Bank Code</td>
                <td style="padding:8px 12px;font-family:monospace;font-weight:700;font-size:16px;">${e(paymentInfo.bankCode ?? '—')}</td></tr>
            <tr><td style="padding:8px 12px;color:#666;">虛擬帳號 Virtual A/C</td>
                <td style="padding:8px 12px;font-family:monospace;font-weight:700;font-size:16px;">${e(paymentInfo.vAccount ?? '—')}</td></tr>
            ${amountRow}
        </table>
        <p style="font-size:12px;color:#888;margin-top:8px;">請使用網銀 / 實體 ATM / 銀行 APP 轉帳到上方虛擬帳號。跨行轉帳將產生手續費（依各銀行公告）。</p>`;
    }
    if (kind === 'CVS') {
        const linkRow = paymentInfo.paymentURL
            ? `<p style="margin-top:12px;"><a href="${e(paymentInfo.paymentURL)}" style="color:#f97316;">查看繳費說明 →</a></p>`
            : '';
        return `
        <table style="width:100%;border-collapse:collapse;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
            <tr><td style="padding:8px 12px;color:#666;width:140px;">超商代碼 CVS Code</td>
                <td style="padding:8px 12px;font-family:monospace;font-weight:700;font-size:18px;">${e(paymentInfo.paymentNo ?? '—')}</td></tr>
            ${amountRow}
        </table>
        <p style="font-size:12px;color:#888;margin-top:8px;">請至 7-11 / 全家 / 萊爾富 / OK 出示此代碼繳費。</p>
        ${linkRow}`;
    }
    if (kind === 'BARCODE') {
        const codes = [paymentInfo.barcode1, paymentInfo.barcode2, paymentInfo.barcode3].filter(Boolean);
        const codeRows = codes.map((c, i) =>
            `<tr><td style="padding:8px 12px;color:#666;width:140px;">Barcode ${i + 1}</td>
                <td style="padding:8px 12px;font-family:monospace;font-size:13px;word-break:break-all;">${e(c)}</td></tr>`
        ).join('');
        const linkRow = paymentInfo.paymentURL
            ? `<p style="margin-top:12px;"><a href="${e(paymentInfo.paymentURL)}" style="color:#f97316;">查看條碼繳費說明 →</a></p>`
            : '';
        return `
        <table style="width:100%;border-collapse:collapse;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
            ${codeRows}
            ${amountRow}
        </table>
        <p style="font-size:12px;color:#888;margin-top:8px;">請至超商出示此條碼繳費（多數超商列印此 email 即可掃描）。</p>
        ${linkRow}`;
    }
    return '';
}

function renderEmailHtml({ customerName, serviceName, slotDate, slotTime, merchantTradeNo, instructionsHtml }) {
    const e = escapeHtml;
    return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa;padding:24px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #f3f4f6;">
    <h1 style="font-size:20px;color:#b45309;margin:0 0 12px;">請於期限內完成繳費</h1>
    <p style="font-size:14px;color:#555;margin:0 0 20px;">Hi ${e(customerName)}，感謝你預約 ${e(serviceName)}（${e(slotDate)} ${e(slotTime)}）。請依下方資訊完成繳費，**款項到帳後**我們會立即寄出預約確認信、Google Calendar 邀請與 Google Meet 連結。</p>
    ${instructionsHtml}
    <p style="font-size:12px;color:#888;margin-top:24px;">訂單編號 Order Reference：<span style="font-family:monospace;">${e(merchantTradeNo)}</span></p>
    <hr style="border:0;border-top:1px solid #f3f4f6;margin:24px 0;" />
    <p style="font-size:12px;color:#888;">如有任何問題，回覆此 email 即可聯絡我們，或加入 LINE 官方帳號：<a href="https://lin.ee/j1DjGlk" style="color:#06C755;">@dori.rito</a></p>
  </div>
</body></html>`;
}

export async function sendPaymentInstructionsEmail({
    to, customerName, serviceName, price, slotDate, slotTime, merchantTradeNo, paymentInfo,
}) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domain) {
        console.warn('[payment-instructions-email] Mailgun not configured, skipping');
        return;
    }
    if (!to) {
        console.warn('[payment-instructions-email] No recipient email, skipping');
        return;
    }

    const kind = classify(paymentInfo?.paymentType);
    const subjectLabel = kind === 'ATM' ? 'ATM 虛擬帳號'
        : kind === 'CVS' ? '超商代碼'
        : kind === 'BARCODE' ? '超商條碼'
        : '繳費資訊';
    const subject = `【Dori & Rito Happydays】請於期限內完成繳費 — ${subjectLabel}`;

    const instructionsHtml = renderInstructionsBlock(paymentInfo || {}, price);
    const html = renderEmailHtml({
        customerName, serviceName, slotDate, slotTime, merchantTradeNo, instructionsHtml,
    });

    const form = new URLSearchParams();
    form.append('from', `Dori & Rito Happydays <noreply@${domain}>`);
    form.append('to', to);
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
        throw new Error(`Mailgun send (payment-instructions) failed: ${err}`);
    }
    console.log(`[payment-instructions-email] Sent ${kind} instructions to ${to} for ${merchantTradeNo}`);
}
