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

    // 2. Only process successful payments
    if (rtnCode !== '1') {
        console.warn(`[booking/notify] Payment failed for ${merchantTradeNo}: RtnCode=${rtnCode}`);
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
        SET processed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo} AND processed_at IS NULL
        RETURNING booking_data
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
