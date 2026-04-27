import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/booking/status?order=DRxxxxxxxx
 *
 * Returns the current state of an order so the confirmation page can render
 * the correct UI (paid vs pending ATM/CVS payment).
 *
 * Response shape:
 * {
 *   status: 'paid' | 'pending_payment' | 'unknown',
 *   paymentInfo?: { paymentType, bankCode, vAccount, expireDate, paymentNo, ... },
 *   service?: { name },
 *   slot?: { date, time }
 * }
 */
export async function GET(request) {
    const orderNo = new URL(request.url).searchParams.get('order');
    if (!orderNo) return NextResponse.json({ error: 'missing_order' }, { status: 400 });

    const rows = await sql`
        SELECT booking_data, automation_completed_at
        FROM processed_orders
        WHERE merchant_trade_no = ${orderNo}
        LIMIT 1
    `;

    if (rows.length === 0) {
        return NextResponse.json({ status: 'unknown' });
    }

    const row = rows[0];
    const data = typeof row.booking_data === 'string'
        ? JSON.parse(row.booking_data)
        : (row.booking_data || {});

    const paid = !!row.automation_completed_at;
    const paymentInfo = data.paymentInfo || null;

    return NextResponse.json({
        status: paid ? 'paid' : (paymentInfo ? 'pending_payment' : 'unknown'),
        processed: paid,  // legacy field used by existing poller
        paymentInfo,
        service: { name: data.serviceName || null },
        slot: data.slotDate ? { date: data.slotDate, time: data.slotTime } : null,
        price: data.price || null,
    });
}
