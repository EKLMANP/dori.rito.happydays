import { NextResponse } from 'next/server';
import { getOrder, updateOrder, archiveOrder } from '@/lib/notion';
import { writeLog, computeChanges } from '@/lib/admin-log';
import { sql } from '@/lib/db';

/** GET /api/admin/orders/[id] */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const order = await getOrder(id);

        // Enrich with Postgres payment data (payment lifecycle + last email sent)
        try {
            const pgRows = await sql`
                SELECT payment_status, order_status, payment_method, payment_expire_at,
                       payment_paid_at, last_email_sent_at, customer_email_override, notes as pg_notes,
                       superseded_by, merchant_trade_no
                FROM processed_orders
                WHERE notion_order_id = ${id}
                ORDER BY processed_at DESC NULLS LAST
                LIMIT 1
            `;
            if (pgRows.length > 0) {
                const pg = pgRows[0];
                order.pgPaymentStatus = pg.payment_status;
                order.pgOrderStatus = pg.order_status;
                order.pgPaymentMethod = pg.payment_method;
                order.pgPaymentExpireAt = pg.payment_expire_at;
                order.pgPaymentPaidAt = pg.payment_paid_at;
                order.lastEmailSentAt = pg.last_email_sent_at;
                order.customerEmailOverride = pg.customer_email_override;
                order.supersededBy = pg.superseded_by;
                order.merchantTradeNo = pg.merchant_trade_no;
            }
        } catch (pgErr) {
            console.warn('[admin/orders/GET] Postgres enrich failed:', pgErr.message);
        }

        return NextResponse.json(order);
    } catch (err) {
        console.error('Get order error:', err);
        if (err.code === 'object_not_found') {
            return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** PATCH /api/admin/orders/[id] { ...updates, notes } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { notes, ...updates } = await request.json();
        const before = await getOrder(id);
        const order = await updateOrder(id, updates);
        const changes = computeChanges(before, order, Object.keys(updates));
        await writeLog({
            action: 'update',
            entityType: 'order',
            entityId: id,
            entityName: order.orderNumber,
            changes,
            notes,
        });
        return NextResponse.json(order);
    } catch (err) {
        console.error('Update order error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/admin/orders/[id] */
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const order = await getOrder(id);
        await archiveOrder(id);
        await writeLog({
            action: 'archive',
            entityType: 'order',
            entityId: id,
            entityName: order.orderNumber,
            notes: body.notes,
        });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
