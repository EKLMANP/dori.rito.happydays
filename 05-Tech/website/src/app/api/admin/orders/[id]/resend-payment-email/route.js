import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendPaymentInstructionsEmail } from '@/lib/payment-instructions-email';
import { generateRepayToken } from '@/lib/booking-token';
import { writeLog } from '@/lib/admin-log';

const RATE_LIMIT_SECONDS = 60;

/**
 * POST /api/admin/orders/[id]/resend-payment-email
 *
 * Body: { targetEmail?: string, adminNote?: string }
 *   - targetEmail: override email; defaults to customer's original email
 *   - adminNote: optional note appended inside the email
 *
 * Rate limit: 60 seconds between sends.
 * Writes to admin_logs (action='resend_payment_email').
 */
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const { targetEmail, adminNote } = await request.json().catch(() => ({}));

        // Load Postgres row by notion_order_id
        const rows = await sql`
            SELECT merchant_trade_no, booking_data, payment_status, payment_expire_at,
                   last_email_sent_at, customer_email_override
            FROM processed_orders
            WHERE notion_order_id = ${id}
            ORDER BY processed_at DESC NULLS LAST
            LIMIT 1
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: '找不到付款紀錄（此訂單可能未走線上付款流程）' }, { status: 404 });
        }

        const row = rows[0];
        const merchantTradeNo = row.merchant_trade_no;

        // Guard: only resend for orders that aren't paid/cancelled
        if (row.payment_status === 'paid') {
            return NextResponse.json({ error: '此訂單已完成付款，無需重發' }, { status: 400 });
        }
        if (row.payment_status === 'cancelled' && !targetEmail) {
            return NextResponse.json({ error: '此訂單已取消' }, { status: 400 });
        }

        // Rate limit: check last_email_sent_at
        if (row.last_email_sent_at) {
            const elapsed = (Date.now() - new Date(row.last_email_sent_at).getTime()) / 1000;
            if (elapsed < RATE_LIMIT_SECONDS) {
                const remaining = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
                return NextResponse.json(
                    { error: `請等待 ${remaining} 秒後再重發`, rateLimitRemaining: remaining },
                    { status: 429 }
                );
            }
        }

        const data = typeof row.booking_data === 'string' ? JSON.parse(row.booking_data) : row.booking_data || {};
        const emailTo = targetEmail || row.customer_email_override || data.email;

        if (!emailTo) {
            return NextResponse.json({ error: '找不到客戶 email，請手動輸入' }, { status: 400 });
        }

        // Build repay URL
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';
        const repayUrl = `${base}/booking/repay/${encodeURIComponent(merchantTradeNo)}?token=${generateRepayToken(merchantTradeNo)}`;

        await sendPaymentInstructionsEmail({
            to: emailTo,
            customerName: data.customerName,
            serviceName: data.serviceName,
            price: data.price,
            slotDate: data.slotDate,
            slotTime: data.slotTime,
            merchantTradeNo,
            paymentInfo: data.paymentInfo || {},
            repayUrl,
            adminNote: adminNote || null,
        });

        // Update last_email_sent_at + optional email override
        await sql`
            UPDATE processed_orders
            SET last_email_sent_at      = NOW(),
                customer_email_override = COALESCE(${targetEmail || null}, customer_email_override)
            WHERE merchant_trade_no = ${merchantTradeNo}
        `;

        // Audit log
        await writeLog({
            action: 'resend_payment_email',
            entityType: 'order',
            entityId: id,
            entityName: merchantTradeNo,
            changes: { targetEmail: emailTo, adminNote: adminNote || null },
            notes: `重發付款 email 至 ${emailTo}${adminNote ? `（備註：${adminNote}）` : ''}`,
        });

        return NextResponse.json({ success: true, sentTo: emailTo });
    } catch (err) {
        console.error('[resend-payment-email] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
