import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateTradeNo, createPaymentOrder } from '@/lib/ecpay';
import { verifyRepayToken } from '@/lib/booking-token';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/booking/repay?tradeNo=...&token=...
 * Returns booking summary so the repay page can render order details.
 */
export async function GET(request) {
    const url = new URL(request.url);
    const tradeNo = url.searchParams.get('tradeNo');
    const token = url.searchParams.get('token');

    if (!tradeNo || !token || !verifyRepayToken(token, tradeNo)) {
        return NextResponse.json({ error: '連結無效或已被竄改' }, { status: 401 });
    }

    const rows = await sql`
        SELECT booking_data, payment_status, payment_expire_at, superseded_by
        FROM processed_orders WHERE merchant_trade_no = ${tradeNo} LIMIT 1
    `;
    if (rows.length === 0) {
        return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
    }

    const row = rows[0];
    if (row.superseded_by) {
        return NextResponse.json({ error: '此訂單已換成新單', supersededBy: row.superseded_by }, { status: 410 });
    }
    if (row.payment_status === 'paid') {
        return NextResponse.json({ error: '此訂單已完成付款' }, { status: 410 });
    }
    if (row.payment_status === 'cancelled' || row.payment_status === 'failed') {
        return NextResponse.json({ error: '此訂單已取消或失敗，請重新預約' }, { status: 410 });
    }
    if (row.payment_expire_at && new Date(row.payment_expire_at) < new Date()) {
        return NextResponse.json({ error: '繳費期限已過，請重新預約' }, { status: 410 });
    }

    const data = typeof row.booking_data === 'string' ? JSON.parse(row.booking_data) : row.booking_data || {};

    return NextResponse.json({
        merchantTradeNo: tradeNo,
        bookingData: {
            serviceId: data.serviceId,
            serviceName: data.serviceName,
            customerName: data.customerName,
            dogName: data.dogName,
            slotDate: data.slotDate,
            slotTime: data.slotTime,
            price: data.price,
        },
        expireAt: row.payment_expire_at,
    });
}

/**
 * POST /api/booking/repay  body: { tradeNo, token }
 * Supersedes the old order and produces a fresh ECPay payment form.
 */
export async function POST(request) {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`booking-repay:${ip}`, 5, 10 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 });
    }

    const body = await request.json();
    const { tradeNo, token } = body || {};

    if (!tradeNo || !token || !verifyRepayToken(token, tradeNo)) {
        return NextResponse.json({ error: '連結無效或已被竄改' }, { status: 401 });
    }

    // Atomic supersede: only succeed if old order is still in pending/in_progress
    const oldRows = await sql`
        SELECT booking_data, payment_status, payment_expire_at, superseded_by
        FROM processed_orders WHERE merchant_trade_no = ${tradeNo} LIMIT 1
    `;
    if (oldRows.length === 0) {
        return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
    }
    const old = oldRows[0];
    if (old.superseded_by || old.payment_status === 'paid' || old.payment_status === 'cancelled') {
        return NextResponse.json({ error: '此訂單已不可變更' }, { status: 410 });
    }
    if (old.payment_expire_at && new Date(old.payment_expire_at) < new Date()) {
        return NextResponse.json({ error: '繳費期限已過' }, { status: 410 });
    }

    const oldData = typeof old.booking_data === 'string' ? JSON.parse(old.booking_data) : old.booking_data || {};

    // 1. Generate new trade number and clone booking data
    const newTradeNo = generateTradeNo();
    const newData = {
        ...oldData,
        merchantTradeNo: newTradeNo,
        repayParent: tradeNo,
        createdAt: new Date().toISOString(),
    };
    delete newData.paymentInfo; // old ATM/CVS code is now void

    // 2. Insert new pending row
    try {
        await sql`
            INSERT INTO processed_orders
                (merchant_trade_no, booking_data, processed_at, payment_status, order_status)
            VALUES
                (${newTradeNo}, ${JSON.stringify(newData)}, NULL, 'pending', 'not_started')
        `;
    } catch (err) {
        console.error('[booking/repay] Insert new order failed:', err);
        return NextResponse.json({ error: '建立新訂單失敗' }, { status: 500 });
    }

    // 3. Mark old row superseded
    await sql`
        UPDATE processed_orders
        SET payment_status = 'cancelled',
            order_status = 'cancelled',
            superseded_by = ${newTradeNo}
        WHERE merchant_trade_no = ${tradeNo} AND payment_status IN ('pending', 'in_progress')
    `;

    // 4. Create ECPay payment form for the new order
    const requestUrl = new URL(request.url);
    const clientBackBase = `${requestUrl.protocol}//${requestUrl.host}`;
    const webhookBase = process.env.NEXT_PUBLIC_SITE_URL || clientBackBase;

    try {
        const { html } = await createPaymentOrder({
            merchantTradeNo: newTradeNo,
            totalAmount: newData.price,
            itemName: newData.serviceName || 'Dori & Rito',
            tradeDesc: `Dori & Rito ${newData.serviceName || ''}`,
            returnUrl: `${webhookBase}/api/booking/notify`,
            clientBackUrl: `${clientBackBase}/api/booking/return?order=${newTradeNo}`,
            paymentInfoUrl: `${webhookBase}/api/booking/payment-info`,
            clientRedirectUrl: `${clientBackBase}/api/booking/return?order=${newTradeNo}`,
        });

        // Background: annotate old Notion order + create new pending order for new trade no
        if (process.env.NOTION_ORDER_DB_ID) {
            (async () => {
                try {
                    const linkRow = await sql`
                        SELECT notion_order_id, booking_data FROM processed_orders WHERE merchant_trade_no = ${tradeNo}
                    `;
                    const oldNotionId = linkRow[0]?.notion_order_id;
                    const oldBookingData = linkRow[0]?.booking_data || {};
                    const customerPageId = (typeof oldBookingData === 'string'
                        ? JSON.parse(oldBookingData)
                        : oldBookingData)?.notionPageId || null;

                    const { markOrderSuperseded, createPendingOrder } = await import('@/lib/notion-crm');

                    // Mark old Notion order superseded
                    if (oldNotionId) {
                        await markOrderSuperseded(oldNotionId, newTradeNo);
                    }

                    // Create a new Notion pending order for the new trade number
                    const newOrderResult = await createPendingOrder(newData, customerPageId);
                    if (newOrderResult?.pageId) {
                        await sql`
                            UPDATE processed_orders
                            SET notion_order_id = ${newOrderResult.pageId}
                            WHERE merchant_trade_no = ${newTradeNo}
                        `;
                    }
                } catch (err) {
                    console.warn('[booking/repay] Notion sync failed:', err.message);
                }
            })();
        }

        return NextResponse.json({
            success: true,
            merchantTradeNo: newTradeNo,
            paymentFormHtml: html,
            bookingData: {
                customerName: newData.customerName,
                dogName: newData.dogName,
                serviceName: newData.serviceName,
                slotDate: newData.slotDate,
                slotTime: newData.slotTime,
                price: newData.price,
            },
        });
    } catch (err) {
        console.error('[booking/repay] ECPay error:', err);
        return NextResponse.json({ error: '建立付款訂單失敗，請稍後再試' }, { status: 500 });
    }
}
