import { NextResponse } from 'next/server';

/**
 * /api/booking/return — ECPay ClientBackURL / ClientRedirectURL handler
 *
 * Customer's browser lands here after ECPay's payment screen. This route is
 * intentionally INERT — it just redirects to the confirmation page.
 *
 * Why no automation here:
 *   ATM / CVS / BARCODE flows redirect the customer back BEFORE the payment is
 *   actually received (they only got a virtual account number). Triggering
 *   email / Calendar / Notion here would mark the order as paid prematurely.
 *
 *   The single source of truth for "payment received" is the server-to-server
 *   webhook at /api/booking/notify (ECPay ReturnURL), which only fires after
 *   ECPay has confirmed the funds.
 */

function redirectToConfirmation(orderNo, request) {
    const target = orderNo
        ? `/booking/confirmation?order=${orderNo}`
        : `/booking?error=missing_order`;
    // 303 See Other: forces the browser to issue GET on the target, even if
    // the original request was POST (ECPay sometimes POSTs to ClientBackURL).
    return NextResponse.redirect(new URL(target, request.url), 303);
}

export async function GET(request) {
    const orderNo = new URL(request.url).searchParams.get('order');
    return redirectToConfirmation(orderNo, request);
}

export async function POST(request) {
    let orderNo = null;
    try {
        const formData = await request.formData();
        orderNo = formData.get('MerchantTradeNo');
    } catch {
        orderNo = new URL(request.url).searchParams.get('order');
    }
    return redirectToConfirmation(orderNo, request);
}
