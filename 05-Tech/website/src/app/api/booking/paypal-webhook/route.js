import { sql } from '@/lib/db';
import { verifyPaypalWebhook, getPaypalOrder } from '@/lib/paypal';
import { runBookingAutomations } from '@/lib/booking-automations';

/**
 * POST /api/booking/paypal-webhook
 *
 * Safety net for PayPal events. The primary flow is /api/booking/paypal-capture
 * (called from the client onApprove), but if the user closes the tab right after
 * approving, the webhook ensures we still run post-payment automations.
 *
 * Idempotency: shares `automation_completed_at` claim with paypal-capture.
 *
 * Required header set (PayPal):
 *   PayPal-Auth-Algo, PayPal-Cert-Url, PayPal-Transmission-Id,
 *   PayPal-Transmission-Sig, PayPal-Transmission-Time
 *
 * Always responds 200 once acknowledged so PayPal stops retrying — internal
 * errors are logged but don't trigger retries.
 */
export async function POST(request) {
    let event;
    try {
        event = await request.json();
    } catch {
        return new Response('bad request', { status: 400 });
    }

    // Lower-case headers for verifier
    const headers = {};
    request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

    const ok = await verifyPaypalWebhook(headers, event).catch((err) => {
        console.error('[paypal-webhook] verify error:', err);
        return false;
    });
    if (!ok) {
        console.warn('[paypal-webhook] signature verification failed');
        return new Response('signature invalid', { status: 400 });
    }

    const eventType = event.event_type;

    // Only act on capture-completed; ignore other lifecycle events.
    if (eventType !== 'PAYMENT.CAPTURE.COMPLETED' && eventType !== 'CHECKOUT.ORDER.APPROVED') {
        return new Response('ignored', { status: 200 });
    }

    // Resolve our merchantTradeNo via custom_id (set in createPaypalOrder).
    const resource = event.resource || {};
    let merchantTradeNo = resource.custom_id || resource.invoice_id || null;
    let captureId = null;
    let amount = null;
    let currency = null;
    let paypalOrderId = null;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        captureId = resource.id || null;
        amount = resource.amount?.value || null;
        currency = resource.amount?.currency_code || null;
        // Order ID can be derived from supplementary_data.related_ids.order_id
        paypalOrderId = resource.supplementary_data?.related_ids?.order_id || null;

        // Fallback: fetch the order to recover custom_id if missing
        if (!merchantTradeNo && paypalOrderId) {
            try {
                const order = await getPaypalOrder(paypalOrderId);
                merchantTradeNo = order.purchase_units?.[0]?.custom_id || null;
            } catch (err) {
                console.error('[paypal-webhook] getPaypalOrder failed:', err);
            }
        }
    } else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
        // Order approved but not yet captured — log and exit (capture endpoint handles fulfillment)
        console.log('[paypal-webhook] order approved:', resource.id);
        return new Response('ok', { status: 200 });
    }

    if (!merchantTradeNo) {
        console.warn('[paypal-webhook] could not resolve merchantTradeNo for event', event.id);
        return new Response('ok', { status: 200 });
    }

    // Idempotent claim
    const rows = await sql`
        SELECT booking_data, automation_completed_at, notion_order_id
        FROM processed_orders
        WHERE merchant_trade_no = ${merchantTradeNo}
        LIMIT 1
    `;
    if (rows.length === 0) {
        console.warn(`[paypal-webhook] order not found: ${merchantTradeNo}`);
        return new Response('ok', { status: 200 });
    }
    if (rows[0].automation_completed_at) {
        return new Response('ok', { status: 200 });
    }

    const claimed = await sql`
        UPDATE processed_orders
        SET processed_at = COALESCE(processed_at, NOW()),
            payment_status = 'paid',
            order_status = 'pending_schedule',
            payment_paid_at = COALESCE(payment_paid_at, NOW()),
            paypal_capture_id = COALESCE(paypal_capture_id, ${captureId}),
            payment_method = 'paypal'
        WHERE merchant_trade_no = ${merchantTradeNo}
          AND automation_completed_at IS NULL
        RETURNING booking_data, notion_order_id
    `;

    if (claimed.length === 0) {
        return new Response('ok', { status: 200 });
    }

    let storedData = {};
    try {
        const raw = claimed[0].booking_data;
        storedData = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    } catch { /* ignore */ }

    const bookingData = {
        ...storedData,
        merchantTradeNo,
        tradeNo: captureId,
        tradeAmt: amount,
        currency,
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
        await runBookingAutomations(bookingData);
    } catch (err) {
        console.error(`[paypal-webhook] automations error for ${merchantTradeNo}:`, err);
    }

    await sql`
        UPDATE processed_orders
        SET automation_completed_at = NOW()
        WHERE merchant_trade_no = ${merchantTradeNo}
    `;

    return new Response('ok', { status: 200 });
}
