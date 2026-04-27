import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateFormResponses } from '@/lib/form-validator';
import { generateTradeNo, createPaymentOrder } from '@/lib/ecpay';
import { generateBookingToken } from '@/lib/booking-token';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/booking/create
 *
 * Creates a booking order and returns ECPay payment form HTML.
 *
 * Body: {
 *   serviceId: string,
 *   slotDate: string (YYYY-MM-DD),
 *   slotTime: string (HH:mm),
 *   formResponses: { [fieldId]: value },
 *   customerName: string,
 *   email: string,
 *   phone: string,
 *   dogName: string,
 * }
 */
export async function POST(request) {
    // Rate limit: 5 creates per 10 minutes per IP
    const ip = getClientIp(request);
    const { allowed, remaining } = checkRateLimit(`booking-create:${ip}`, 5, 10 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: '請求過於頻繁，請稍後再試' },
            { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
        );
    }

    const body = await request.json();
    const { serviceId, slotDate, slotTime, formResponses, formSections, customerName, email, phone, dogName, notionPageId } = body;

    // Basic validation
    if (!serviceId || !slotDate || !slotTime || !customerName || !email) {
        return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    }

    // 1. Validate form responses against DB schema
    const validation = await validateFormResponses(serviceId, formResponses || {});
    if (!validation.valid) {
        return NextResponse.json({ error: '表單驗證失敗', details: validation.errors }, { status: 400 });
    }

    // 2. Verify service exists and is active
    const services = await sql`
        SELECT id, name, price, duration FROM services WHERE id = ${serviceId} AND is_active = true
    `;
    if (services.length === 0) {
        return NextResponse.json({ error: '服務不存在或已停用' }, { status: 404 });
    }
    const service = services[0];

    // 3. Verify slot is still available (double-check)
    // The slot availability was checked client-side via /api/booking/slots
    // Here we just verify the slot is in the future
    const slotDateTime = new Date(`${slotDate}T${slotTime}:00+08:00`);
    if (slotDateTime < new Date()) {
        return NextResponse.json({ error: '所選時段已過' }, { status: 400 });
    }

    // 4. Generate trade number and CSRF token
    const merchantTradeNo = generateTradeNo();
    const { token: csrfToken, timestamp } = generateBookingToken(`${serviceId}:${merchantTradeNo}`);

    // 5. Build booking data for storage
    const bookingData = {
        serviceId,
        serviceName: service.name,
        customerName,
        email,
        phone,
        dogName,
        slotDate,
        slotTime,
        price: service.price,
        duration: service.duration,
        merchantTradeNo,
        formResponses,
        formSections,
        notionPageId: notionPageId || null,
        csrfToken,
        csrfTimestamp: timestamp,
        createdAt: new Date().toISOString(),
    };

    // 5b. Persist pending booking data (processed_at = NULL means awaiting payment)
    // Initial state: payment_status='pending', order_status='not_started'
    try {
        await sql`
            INSERT INTO processed_orders
                (merchant_trade_no, booking_data, processed_at, payment_status, order_status)
            VALUES
                (${merchantTradeNo}, ${JSON.stringify(bookingData)}, NULL, 'pending', 'not_started')
            ON CONFLICT (merchant_trade_no) DO NOTHING
        `;
    } catch (dbErr) {
        console.warn('[booking/create] Failed to persist pending booking:', dbErr.message);
        // Non-fatal — continue to payment even if DB persist fails
    }

    // 5c. Create Notion pending order (non-blocking; failure won't block ECPay flow)
    // If notionPageId (customer page) is missing — because questionnaire-submit lost the race
    // or failed — create the customer page first so every order always has a linked customer.
    if (process.env.NOTION_ORDER_DB_ID) {
        (async () => {
            try {
                const { createCustomerPage, createPendingOrder } = await import('@/lib/notion-crm');
                let customerPageId = notionPageId || null;

                if (!customerPageId && process.env.NOTION_CUSTOMER_DB_ID) {
                    try {
                        const customer = await createCustomerPage(formSections || [], formResponses || {});
                        customerPageId = customer?.pageId || null;
                        console.log('[booking/create] Created missing customer page:', customerPageId);
                    } catch (err) {
                        console.warn('[booking/create] Customer page creation failed:', err.message);
                    }
                }

                const result = await createPendingOrder(bookingData, customerPageId);
                if (result?.pageId) {
                    await sql`
                        UPDATE processed_orders
                        SET notion_order_id = ${result.pageId}
                        WHERE merchant_trade_no = ${merchantTradeNo}
                    `;
                }
            } catch (err) {
                console.warn('[booking/create] Notion pending order failed:', err.message);
            }
        })();
    }

    // 6. Create ECPay payment order
    // clientBackUrl: use request origin so browser redirects back to the same host
    // (localhost in dev, production domain in prod)
    const requestUrl = new URL(request.url);
    const clientBackBase = `${requestUrl.protocol}//${requestUrl.host}`;
    // returnUrl (webhook): must be publicly accessible — ECPay server calls this
    const webhookBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    try {
        const { html } = await createPaymentOrder({
            merchantTradeNo,
            totalAmount: service.price,
            itemName: service.name,
            tradeDesc: `Dori & Rito ${service.name}`,
            returnUrl: `${webhookBase}/api/booking/notify`,
            clientBackUrl: `${clientBackBase}/api/booking/return?order=${merchantTradeNo}`,
            // For ATM/CVS/BARCODE: ECPay posts virtual account info here when assigned.
            paymentInfoUrl: `${webhookBase}/api/booking/payment-info`,
            // After viewing the ATM/CVS payment code page, customer is redirected here.
            clientRedirectUrl: `${clientBackBase}/api/booking/return?order=${merchantTradeNo}`,
        });

        return NextResponse.json({
            success: true,
            merchantTradeNo,
            price: service.price,
            serviceName: service.name,
            paymentFormHtml: html,
            bookingData: {
                customerName,
                dogName,
                slotDate,
                slotTime,
                serviceName: service.name,
                price: service.price,
            },
        });
    } catch (err) {
        console.error('[booking/create] ECPay error:', err);
        return NextResponse.json(
            { error: '建立付款訂單失敗，請稍後再試' },
            { status: 500 }
        );
    }
}
