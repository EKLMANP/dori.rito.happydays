import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { runBookingAutomations } from '@/lib/booking-automations';

/**
 * /api/booking/return — ECPay ClientBackURL handler
 *
 * After payment, ECPay redirects client browser here.
 * We check the order status and process it if the server-to-server webhook
 * hasn't arrived yet (common in local dev where ECPay can't reach localhost).
 *
 * This is a DUAL-TRIGGER design:
 *   - Primary trigger:  POST /api/booking/notify (ECPay webhook, server-to-server)
 *   - Fallback trigger: GET/POST /api/booking/return (browser redirect)
 *
 * Both paths share idempotency via processed_orders.processed_at.
 */

/**
 * Process an unprocessed order: mark as processed + run automations.
 * Returns true if processing was done, false if already processed or no data.
 */
async function processOrderIfNeeded(merchantTradeNo) {
    // Check if automations already completed (handles duplicate browser refreshes / ECPay retries)
    const alreadyDone = await sql`
        SELECT automation_completed_at FROM processed_orders
        WHERE merchant_trade_no = ${merchantTradeNo} AND automation_completed_at IS NOT NULL
    `;
    if (alreadyDone.length > 0) {
        console.log(`[booking/return] Automations already completed for ${merchantTradeNo}`);
        return true;
    }

    // Atomic claim: UPDATE ... WHERE processed_at IS NULL RETURNING booking_data
    // Only the first caller gets a row back — all others get empty result (no race condition)
    const claimed = await sql`
        UPDATE processed_orders
        SET processed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo} AND processed_at IS NULL
        RETURNING booking_data
    `;

    if (claimed.length === 0) {
        // Either already processed (by webhook or another request) or order doesn't exist
        // Check if order exists at all
        const exists = await sql`
            SELECT 1 FROM processed_orders WHERE merchant_trade_no = ${merchantTradeNo}
        `;
        if (exists.length === 0) {
            console.warn(`[booking/return] Order not found: ${merchantTradeNo}`);
            return false;
        }
        console.log(`[booking/return] Already processed: ${merchantTradeNo}`);
        return true; // Already processed — skip automations
    }

    // We won the claim — parse booking data and run automations
    let bookingData = {};
    try {
        const raw = claimed[0].booking_data;
        bookingData = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    } catch {
        console.warn('[booking/return] Failed to parse booking data');
    }

    try {
        const result = await runBookingAutomations(bookingData);
        if (result.failed.length > 0) {
            console.error(`[booking/return] ${merchantTradeNo}: ${result.failed.length} handler(s) failed:`, JSON.stringify(result.failed));
        }
    } catch (err) {
        console.error(`[booking/return] Automations error for ${merchantTradeNo}:`, err);
    }

    // Mark automations as completed (prevents duplicate processing)
    await sql`
        UPDATE processed_orders
        SET automation_completed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    return true;
}

/**
 * GET /api/booking/return?order=DRxxxxxxxx
 *
 * Browser arrives here after ECPay payment.
 * If webhook hasn't processed the order yet, we process it inline.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order');

    if (!orderNo) {
        return NextResponse.redirect(new URL('/booking?error=missing_order', request.url));
    }

    // Process (or confirm already processed)
    await processOrderIfNeeded(orderNo);

    // Always redirect to confirmation — no "pending" status needed
    return NextResponse.redirect(
        new URL(`/booking/confirmation?order=${orderNo}`, request.url)
    );
}

/**
 * POST /api/booking/return
 *
 * Some ECPay flows POST back to ClientBackURL with form data.
 * Handle identically — extract order number and process.
 */
export async function POST(request) {
    let orderNo;
    try {
        const formData = await request.formData();
        orderNo = formData.get('MerchantTradeNo');
    } catch {
        const { searchParams } = new URL(request.url);
        orderNo = searchParams.get('order');
    }

    if (!orderNo) {
        return NextResponse.redirect(new URL('/booking?error=missing_order', request.url));
    }

    // Process (or confirm already processed)
    await processOrderIfNeeded(orderNo);

    return NextResponse.redirect(
        new URL(`/booking/confirmation?order=${orderNo}`, request.url)
    );
}
