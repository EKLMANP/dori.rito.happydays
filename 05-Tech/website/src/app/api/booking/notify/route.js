import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyCheckMacValue } from '@/lib/ecpay';
import { runBookingAutomations } from '@/lib/booking-automations';

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

    // 2. Idempotency check — skip if already processed (processed_at IS NOT NULL)
    const existing = await sql`
        SELECT booking_data, processed_at
        FROM processed_orders
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    if (existing.length > 0 && existing[0].processed_at) {
        console.log(`[booking/notify] Already processed: ${merchantTradeNo}`);
        return new Response('1|OK');
    }

    // 3. Only process successful payments
    if (rtnCode !== '1') {
        console.warn(`[booking/notify] Payment failed for ${merchantTradeNo}: RtnCode=${rtnCode}`);
        return new Response('1|OK');
    }

    // 4. Retrieve stored booking data (persisted by /api/booking/create)
    let storedData = {};
    if (existing.length > 0 && existing[0].booking_data) {
        try {
            storedData = typeof existing[0].booking_data === 'string'
                ? JSON.parse(existing[0].booking_data)
                : existing[0].booking_data;
        } catch {
            console.warn('[booking/notify] Failed to parse stored booking data');
        }
    }

    // 5. Merge stored booking data with ECPay payment results
    const bookingData = {
        ...storedData,
        merchantTradeNo,
        tradeNo: params.TradeNo,
        tradeAmt: params.TradeAmt,
        paymentDate: params.PaymentDate,
        paymentType: params.PaymentType,
        price: storedData.price || parseInt(params.TradeAmt) || 0,
        // Fallbacks from ECPay custom fields (in case stored data is missing)
        customerName: storedData.customerName || params.CustomField1 || '',
        email: storedData.email || params.CustomField2 || '',
        dogName: storedData.dogName || params.CustomField3 || '',
        serviceName: storedData.serviceName || params.CustomField4 || '',
    };

    // 6. Mark as processed + update with payment info
    if (existing.length > 0) {
        await sql`
            UPDATE processed_orders
            SET processed_at = NOW(), booking_data = ${JSON.stringify(bookingData)}
            WHERE merchant_trade_no = ${merchantTradeNo}
        `;
    } else {
        await sql`
            INSERT INTO processed_orders (merchant_trade_no, booking_data, processed_at)
            VALUES (${merchantTradeNo}, ${JSON.stringify(bookingData)}, NOW())
        `;
    }

    // 7. Run all post-payment automations (includes Notion questionnaire push)
    try {
        const result = await runBookingAutomations(bookingData);
        console.log(
            `[booking/notify] Automations for ${merchantTradeNo}:`,
            `${result.succeeded.length} succeeded, ${result.failed.length} failed`
        );
    } catch (err) {
        console.error(`[booking/notify] Automations error for ${merchantTradeNo}:`, err);
    }

    // 8. Return success per ECPay spec
    return new Response('1|OK');
}
