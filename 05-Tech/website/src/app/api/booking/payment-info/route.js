import { sql } from '@/lib/db';
import { verifyCheckMacValue } from '@/lib/ecpay';
import { sendPaymentInstructionsEmail } from '@/lib/payment-instructions-email';
import { updateOrderPaymentMethod } from '@/lib/notion-crm';
import { generateRepayToken } from '@/lib/booking-token';

function buildRepayUrl(merchantTradeNo) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';
    const token = generateRepayToken(merchantTradeNo);
    return `${base}/booking/repay/${encodeURIComponent(merchantTradeNo)}?token=${token}`;
}

/**
 * Map ECPay PaymentType to a Chinese label for Notion 付款方式.
 * Examples: 'ATM_TAISHIN' → 'ATM', 'CVS_CVS' → '超商代碼', 'BARCODE_BARCODE' → '超商條碼'.
 */
function mapPaymentMethod(paymentType) {
    if (!paymentType) return null;
    if (paymentType.startsWith('Credit')) return '信用卡';
    if (paymentType.startsWith('ATM')) return 'ATM';
    if (paymentType.startsWith('CVS')) return '超商代碼';
    if (paymentType.startsWith('BARCODE')) return '超商條碼';
    return null;
}

/**
 * Parse ECPay ExpireDate to ISO timestamp.
 * Format may be 'YYYY/MM/DD' (ATM, end-of-day TPE) or 'YYYY/MM/DD HH:MM:SS' (CVS/BARCODE).
 */
function parseExpireDate(s) {
    if (!s) return null;
    const trimmed = String(s).trim();
    const fullMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (fullMatch) {
        const [, y, mo, d, h, mi, se] = fullMatch;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}+08:00`);
    }
    const dateMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (dateMatch) {
        const [, y, mo, d] = dateMatch;
        return new Date(`${y}-${mo}-${d}T23:59:59+08:00`);
    }
    return null;
}

/**
 * POST /api/booking/payment-info
 *
 * ECPay PaymentInfoURL handler — called when ECPay assigns a virtual account
 * (ATM) or payment code (CVS / BARCODE) to the customer. This is informational
 * only; actual payment success comes later via /api/booking/notify (ReturnURL).
 *
 * We persist the payment instructions onto the order so admin/customer flows
 * can surface them later. Booking automations stay deferred until /notify.
 *
 * Must return "1|OK" per ECPay specification.
 */
export async function POST(request) {
    let params;

    try {
        const formData = await request.formData();
        params = Object.fromEntries(formData.entries());
    } catch {
        try {
            params = await request.json();
        } catch {
            return new Response('0|InvalidRequest', { status: 400 });
        }
    }

    if (!verifyCheckMacValue(params)) {
        console.error('[booking/payment-info] Invalid CheckMacValue');
        return new Response('0|CheckMacValueError', { status: 400 });
    }

    const merchantTradeNo = params.MerchantTradeNo;
    if (!merchantTradeNo) return new Response('0|MissingTradeNo', { status: 400 });

    const paymentInfo = {
        paymentType: params.PaymentType,
        tradeNo: params.TradeNo,
        // ATM
        bankCode: params.BankCode,
        vAccount: params.vAccount,
        expireDate: params.ExpireDate,
        // CVS / BARCODE
        paymentNo: params.PaymentNo,
        paymentURL: params.PaymentURL,
        barcode1: params.Barcode1,
        barcode2: params.Barcode2,
        barcode3: params.Barcode3,
    };

    const paymentMethod = mapPaymentMethod(params.PaymentType);
    const expireAt = parseExpireDate(params.ExpireDate);

    try {
        await sql`
            UPDATE processed_orders
            SET booking_data = jsonb_set(
                    COALESCE(booking_data, '{}'::jsonb),
                    '{paymentInfo}',
                    ${JSON.stringify(paymentInfo)}::jsonb,
                    true
                ),
                payment_status = 'in_progress',
                payment_method = COALESCE(${paymentMethod}, payment_method),
                payment_expire_at = COALESCE(${expireAt ? expireAt.toISOString() : null}, payment_expire_at)
            WHERE merchant_trade_no = ${merchantTradeNo}
        `;
        console.log(`[booking/payment-info] Stored payment info for ${merchantTradeNo} (${params.PaymentType})`);
    } catch (err) {
        console.error('[booking/payment-info] DB update failed:', err);
        // Still return 1|OK so ECPay doesn't retry indefinitely
    }

    // Send payment instructions email + sync Notion order. Failures must not block 1|OK.
    try {
        const rows = await sql`
            SELECT booking_data, notion_order_id, customer_email_override
            FROM processed_orders WHERE merchant_trade_no = ${merchantTradeNo} LIMIT 1
        `;
        if (rows.length > 0) {
            const data = typeof rows[0].booking_data === 'string'
                ? JSON.parse(rows[0].booking_data)
                : rows[0].booking_data || {};
            const notionOrderId = rows[0].notion_order_id;
            const targetEmail = rows[0].customer_email_override || data.email;

            if (targetEmail) {
                await sendPaymentInstructionsEmail({
                    to: targetEmail,
                    customerName: data.customerName,
                    serviceName: data.serviceName,
                    price: data.price,
                    slotDate: data.slotDate,
                    slotTime: data.slotTime,
                    merchantTradeNo,
                    paymentInfo,
                    repayUrl: buildRepayUrl(merchantTradeNo),
                });
                await sql`
                    UPDATE processed_orders SET last_email_sent_at = NOW()
                    WHERE merchant_trade_no = ${merchantTradeNo}
                `;
            }

            if (notionOrderId && paymentMethod) {
                try {
                    await updateOrderPaymentMethod(notionOrderId, {
                        paymentMethod,
                        expireAt,
                        paymentEmail: targetEmail,
                    });
                } catch (err) {
                    console.warn('[booking/payment-info] Notion order update failed:', err.message);
                }
            }
        }
    } catch (err) {
        console.error('[booking/payment-info] Post-store actions failed:', err);
    }

    return new Response('1|OK');
}
