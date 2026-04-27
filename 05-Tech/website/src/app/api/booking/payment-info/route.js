import { sql } from '@/lib/db';
import { verifyCheckMacValue } from '@/lib/ecpay';

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

    try {
        await sql`
            UPDATE processed_orders
            SET booking_data = jsonb_set(
                COALESCE(booking_data, '{}'::jsonb),
                '{paymentInfo}',
                ${JSON.stringify(paymentInfo)}::jsonb,
                true
            )
            WHERE merchant_trade_no = ${merchantTradeNo}
        `;
        console.log(`[booking/payment-info] Stored payment info for ${merchantTradeNo} (${params.PaymentType})`);
    } catch (err) {
        console.error('[booking/payment-info] DB update failed:', err);
        // Still return 1|OK so ECPay doesn't retry indefinitely
    }

    return new Response('1|OK');
}
