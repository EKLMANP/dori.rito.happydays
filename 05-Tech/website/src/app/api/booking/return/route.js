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
    // 1. Check if order exists and hasn't been processed yet
    const existing = await sql`
        SELECT booking_data, processed_at
        FROM processed_orders
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    if (existing.length === 0) {
        console.warn(`[booking/return] Order not found: ${merchantTradeNo}`);
        return false;
    }

    if (existing[0].processed_at) {
        return true; // Already processed by webhook — skip
    }

    // 2. Load stored booking data
    let bookingData = {};
    try {
        bookingData = typeof existing[0].booking_data === 'string'
            ? JSON.parse(existing[0].booking_data)
            : existing[0].booking_data || {};
    } catch {
        console.warn('[booking/return] Failed to parse booking data');
    }

    // 3. Mark as processed FIRST (idempotency — prevents double processing)
    await sql`
        UPDATE processed_orders
        SET processed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo} AND processed_at IS NULL
    `;

    // 4. Run all post-payment automations
    try {
        const result = await runBookingAutomations(bookingData);
        if (result.failed.length > 0) {
            console.error(`[booking/return] ${merchantTradeNo}: ${result.failed.length} handler(s) failed:`, JSON.stringify(result.failed));
        }
    } catch (err) {
        console.error(`[booking/return] Automations error for ${merchantTradeNo}:`, err);
    }

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
