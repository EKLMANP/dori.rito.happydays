import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { capturePaypalOrder } from '@/lib/paypal';
import { runBookingAutomations } from '@/lib/booking-automations';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/booking/paypal-capture
 *
 * Called from the client inside PayPal Buttons' onApprove handler with the
 * PayPal-issued orderId. Captures the funds, persists the result, and runs
 * the same post-payment automations as ECPay (Notion sync / Calendar / email).
 *
 * Body: { paypalOrderId: string, merchantTradeNo: string }
 *
 * Returns: { success: true, status, redirectUrl }
 *
 * Idempotent: protected by `automation_completed_at` flag (re-runs are no-ops).
 */
export async function POST(request) {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`paypal-capture:${ip}`, 10, 10 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json({ error: '請求過於頻繁' }, { status: 429 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { paypalOrderId, merchantTradeNo } = body || {};
    if (!paypalOrderId || !merchantTradeNo) {
        return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    }

    // Look up the pending order — must match both IDs to prevent cross-order capture.
    const rows = await sql`
        SELECT booking_data, payment_status, automation_completed_at, notion_order_id, paypal_order_id
        FROM processed_orders
        WHERE merchant_trade_no = ${merchantTradeNo}
        LIMIT 1
    `;
    if (rows.length === 0) {
        return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    }
    const row = rows[0];
    if (row.paypal_order_id && row.paypal_order_id !== paypalOrderId) {
        return NextResponse.json({ error: 'PayPal 訂單不符' }, { status: 400 });
    }

    // Already done? short-circuit (idempotent).
    if (row.payment_status === 'paid' && row.automation_completed_at) {
        return NextResponse.json({
            success: true,
            status: 'COMPLETED',
            redirectUrl: `/booking/confirmation?order=${encodeURIComponent(merchantTradeNo)}`,
        });
    }

    let captureResult;
    try {
        captureResult = await capturePaypalOrder(paypalOrderId);
    } catch (err) {
        console.error('[paypal-capture] capture failed:', err);
        await sql`
            UPDATE processed_orders
            SET payment_status = 'failed', order_status = 'reselect_payment'
            WHERE merchant_trade_no = ${merchantTradeNo} AND payment_status != 'paid'
        `;
        return NextResponse.json({ error: '付款扣款失敗' }, { status: 502 });
    }

    if (captureResult.status !== 'COMPLETED') {
        return NextResponse.json(
            { error: `PayPal 狀態異常：${captureResult.status}` },
            { status: 400 }
        );
    }

    // Atomic claim — first caller (capture vs webhook) gets to run automations.
    const claimed = await sql`
        UPDATE processed_orders
        SET processed_at = COALESCE(processed_at, NOW()),
            payment_status = 'paid',
            order_status = 'pending_schedule',
            payment_paid_at = NOW(),
            paypal_capture_id = ${captureResult.captureId},
            payment_method = 'paypal'
        WHERE merchant_trade_no = ${merchantTradeNo}
          AND (automation_completed_at IS NULL)
        RETURNING booking_data, notion_order_id
    `;

    if (claimed.length === 0) {
        // Webhook beat us — automations already running/completed.
        return NextResponse.json({
            success: true,
            status: 'COMPLETED',
            redirectUrl: `/booking/confirmation?order=${encodeURIComponent(merchantTradeNo)}`,
        });
    }

    let storedData = {};
    try {
        const raw = claimed[0].booking_data;
        storedData = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    } catch { /* fall through */ }

    const bookingData = {
        ...storedData,
        merchantTradeNo,
        tradeNo: captureResult.captureId,
        tradeAmt: captureResult.amount?.value,
        currency: captureResult.amount?.currency,
        paymentDate: new Date().toISOString(),
        paymentType: 'PayPal',
        paymentProvider: 'paypal',
        notionOrderId: claimed[0].notion_order_id || null,
    };

    await sql`
        UPDATE processed_orders
        SET booking_data = ${JSON.stringify(bookingData)}
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    try {
        const result = await runBookingAutomations(bookingData);
        console.log(
            `[paypal-capture] Automations for ${merchantTradeNo}:`,
            `${result.succeeded.length} ok, ${result.failed.length} failed`
        );
    } catch (err) {
        console.error(`[paypal-capture] automations error for ${merchantTradeNo}:`, err);
    }

    await sql`
        UPDATE processed_orders
        SET automation_completed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        redirectUrl: `/booking/confirmation?order=${encodeURIComponent(merchantTradeNo)}`,
    });
}
