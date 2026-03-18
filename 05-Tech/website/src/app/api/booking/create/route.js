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
    try {
        await sql`
            INSERT INTO processed_orders (merchant_trade_no, booking_data, processed_at)
            VALUES (${merchantTradeNo}, ${JSON.stringify(bookingData)}, NULL)
            ON CONFLICT (merchant_trade_no) DO NOTHING
        `;
    } catch (dbErr) {
        console.warn('[booking/create] Failed to persist pending booking:', dbErr.message);
        // Non-fatal — continue to payment even if DB persist fails
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
