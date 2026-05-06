import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyCheckMacValue } from '@/lib/ecpay';
import { runBookingAutomations } from '@/lib/booking-automations';
import { generateRepayToken } from '@/lib/booking-token';
import { sendPaymentInstructionsEmail } from '@/lib/payment-instructions-email';

function buildRepayUrl(merchantTradeNo) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';
    return `${base}/booking/repay/${encodeURIComponent(merchantTradeNo)}?token=${generateRepayToken(merchantTradeNo)}`;
}

async function handlePaymentFailure(merchantTradeNo, rtnCode, rtnMsg) {
    const rows = await sql`
        SELECT booking_data, payment_expire_at, notion_order_id, payment_status
        FROM processed_orders WHERE merchant_trade_no = ${merchantTradeNo} LIMIT 1
    `;
    if (rows.length === 0) return;
    const row = rows[0];
    if (row.payment_status === 'paid' || row.payment_status === 'cancelled') return;

    const isExpired = row.payment_expire_at && new Date(row.payment_expire_at) < new Date();

    if (isExpired) {
        // Silently cancel — user let it expire
        await sql`
            UPDATE processed_orders
            SET payment_status = 'cancelled', order_status = 'cancelled'
            WHERE merchant_trade_no = ${merchantTradeNo}
        `;
        // Sync Notion
        if (row.notion_order_id) {
            try {
                const { markOrderSuperseded } = await import('@/lib/notion-crm');
                // Reuse markOrderSuperseded to set cancelled/failed in Notion
                const { notionFetch } = await import('@/lib/notion-crm').catch(() => ({}));
                const apiKey = process.env.NOTION_API_KEY_CRM || process.env.NOTION_API_KEY;
                await fetch(`https://api.notion.com/v1/pages/${row.notion_order_id}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
                    body: JSON.stringify({ properties: { '付款狀態': { status: { name: '付款失敗' } } } }),
                });
            } catch (err) {
                console.warn('[notify] Notion expire cancel failed:', err.message);
            }
        }
        console.log(`[booking/notify] Expired order cancelled: ${merchantTradeNo}`);
        return;
    }

    // Non-expiry failure → reselect_payment + resend email with repay link
    await sql`
        UPDATE processed_orders
        SET payment_status = 'pending', order_status = 'reselect_payment'
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    const data = typeof row.booking_data === 'string' ? JSON.parse(row.booking_data) : row.booking_data || {};
    if (data.email) {
        try {
            const locale = data.locale || 'zh-TW';
            await sendPaymentInstructionsEmail({
                to: data.email,
                customerName: data.customerName,
                serviceName: data.serviceName,
                price: data.price,
                slotDate: data.slotDate,
                slotTime: data.slotTime,
                merchantTradeNo,
                paymentInfo: data.paymentInfo || {},
                repayUrl: buildRepayUrl(merchantTradeNo),
                adminNote: locale === 'en'
                    ? `Payment failed (code ${rtnCode}). Click the button below to choose a different payment method.`
                    : `付款未成功（代碼 ${rtnCode}），請點擊按鈕重新選擇付款方式。`,
                locale,
            });
            await sql`UPDATE processed_orders SET last_email_sent_at = NOW() WHERE merchant_trade_no = ${merchantTradeNo}`;
        } catch (err) {
            console.error('[notify] Resend failure email failed:', err.message);
        }
    }

    // Notify admin via Telegram
    const botToken = process.env.TELEGRAM_DR_FNACC_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_DR_CS_TEAM;
    if (botToken && chatId) {
        const msg = `⚠️ 付款失敗\n訂單：${merchantTradeNo}\n客戶：${data.customerName}\nRtnCode：${rtnCode}\n已自動重寄付款通知`;
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg }),
        }).catch(() => {});
    }
    console.log(`[booking/notify] Payment failed (non-expiry), reselect triggered: ${merchantTradeNo}`);
}

/**
 * POST /api/booking/notify
 *
 * ECPay webhook handler (ReturnURL).
 * Called by ECPay server when payment completes.
 * Must return "1|OK" on success per ECPay specification.
 */
export async function POST(request) {
    let params;

    try {
        const formData = await request.formData();
        params = Object.fromEntries(formData.entries());
    } catch {
        // Try JSON body as fallback
        try {
            params = await request.json();
        } catch {
            return new Response('0|InvalidRequest', { status: 400 });
        }
    }

    // 1. Verify CheckMacValue
    if (!verifyCheckMacValue(params)) {
        console.error('[booking/notify] Invalid CheckMacValue');
        return new Response('0|CheckMacValueError', { status: 400 });
    }

    const merchantTradeNo = params.MerchantTradeNo;
    const rtnCode = params.RtnCode; // "1" = success

    // 2. Handle failed payments
    if (rtnCode !== '1') {
        console.warn(`[booking/notify] Payment failed for ${merchantTradeNo}: RtnCode=${rtnCode}, Msg=${params.RtnMsg}`);
        handlePaymentFailure(merchantTradeNo, rtnCode, params.RtnMsg).catch((err) =>
            console.error('[booking/notify] handlePaymentFailure error:', err)
        );
        return new Response('1|OK');
    }

    // 3. Check if automations already completed (handles ECPay webhook retries)
    const alreadyDone = await sql`
        SELECT automation_completed_at FROM processed_orders
        WHERE merchant_trade_no = ${merchantTradeNo} AND automation_completed_at IS NOT NULL
    `;
    if (alreadyDone.length > 0) {
        console.log(`[booking/notify] Automations already completed for ${merchantTradeNo}, skipping retry`);
        return new Response('1|OK');
    }

    // 4. Atomic claim: only the first caller gets to process (prevents race with /return)
    const claimed = await sql`
        UPDATE processed_orders
        SET processed_at = NOW(),
            payment_status = 'paid',
            order_status = 'pending_schedule',
            payment_paid_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo} AND processed_at IS NULL
        RETURNING booking_data, notion_order_id
    `;

    if (claimed.length === 0) {
        // Already processed by /return handler, or order doesn't exist yet
        // Try INSERT for edge case where webhook arrives before /create finishes
        try {
            await sql`
                INSERT INTO processed_orders (merchant_trade_no, booking_data, processed_at)
                VALUES (${merchantTradeNo}, ${JSON.stringify({ merchantTradeNo })}, NOW())
                ON CONFLICT (merchant_trade_no) DO NOTHING
            `;
        } catch { /* already exists — fine */ }
        console.log(`[booking/notify] Already processed or claimed: ${merchantTradeNo}`);
        return new Response('1|OK');
    }

    // 4. Parse stored booking data + merge with ECPay payment results
    let storedData = {};
    try {
        const raw = claimed[0].booking_data;
        storedData = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    } catch {
        console.warn('[booking/notify] Failed to parse stored booking data');
    }

    const bookingData = {
        ...storedData,
        merchantTradeNo,
        tradeNo: params.TradeNo,
        tradeAmt: params.TradeAmt,
        paymentDate: params.PaymentDate,
        paymentType: params.PaymentType,
        price: storedData.price || parseInt(params.TradeAmt) || 0,
        customerName: storedData.customerName || params.CustomField1 || '',
        email: storedData.email || params.CustomField2 || '',
        dogName: storedData.dogName || params.CustomField3 || '',
        serviceName: storedData.serviceName || params.CustomField4 || '',
        notionOrderId: claimed[0].notion_order_id || null,
    };

    // 6. Persist merged booking data back to DB
    await sql`
        UPDATE processed_orders
        SET booking_data = ${JSON.stringify(bookingData)}
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    // 7. Run all post-payment automations
    try {
        const result = await runBookingAutomations(bookingData);
        console.log(
            `[booking/notify] Automations for ${merchantTradeNo}:`,
            `${result.succeeded.length} succeeded, ${result.failed.length} failed`
        );
    } catch (err) {
        console.error(`[booking/notify] Automations error for ${merchantTradeNo}:`, err);
    }

    // 8. Mark automations as completed (prevents duplicate processing on ECPay retries)
    await sql`
        UPDATE processed_orders
        SET automation_completed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    // 9. Return success per ECPay spec
    return new Response('1|OK');
}
