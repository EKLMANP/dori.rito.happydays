/**
 * PayPal Orders v2 Integration
 *
 * Handles:
 * 1. OAuth access-token exchange (cached for ~9 minutes)
 * 2. Create / capture PayPal Orders
 * 3. Verify PayPal webhook signatures
 *
 * Env vars:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_API_BASE         (default: https://api-m.sandbox.paypal.com)
 *   PAYPAL_WEBHOOK_ID       (used for webhook verify)
 *   PAYPAL_CURRENCY         (default: USD)
 *   PAYPAL_TWD_TO_USD_RATE  (default: 33)  — TWD per 1 USD; bake buffer in here
 *   NEXT_PUBLIC_PAYPAL_CLIENT_ID — exposed to client SDK script
 */

const stripEnv = (v) => {
    const s = (v || '').trim();
    return s.endsWith('\\n') ? s.slice(0, -2) : s;
};

const API_BASE = () => stripEnv(process.env.PAYPAL_API_BASE) || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = () => stripEnv(process.env.PAYPAL_CLIENT_ID);
const CLIENT_SECRET = () => stripEnv(process.env.PAYPAL_CLIENT_SECRET);
const WEBHOOK_ID = () => stripEnv(process.env.PAYPAL_WEBHOOK_ID);
export const CURRENCY = () => stripEnv(process.env.PAYPAL_CURRENCY) || 'USD';
const TWD_TO_USD_RATE = () => parseFloat(stripEnv(process.env.PAYPAL_TWD_TO_USD_RATE) || '33');

/**
 * Convert a TWD integer price to the target PayPal currency string.
 * USD is rounded up to whole dollar (buffer absorbs rounding loss + small FX swings).
 * TWD is passed through as-is (PayPal accepts TWD, integer-only).
 */
export function convertTwdToPaypalAmount(twd) {
    const currency = CURRENCY();
    if (currency === 'TWD') {
        return { value: String(Math.round(twd)), currency };
    }
    if (currency === 'USD') {
        const rate = TWD_TO_USD_RATE() || 33;
        const usd = Math.ceil(twd / rate);
        return { value: usd.toFixed(2), currency };
    }
    // Other currencies: callers can pre-convert externally
    throw new Error(`Unsupported PAYPAL_CURRENCY: ${currency}`);
}

/* ───────── OAuth token cache ───────── */

let _tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
    if (_tokenCache.token && Date.now() < _tokenCache.expiresAt) {
        return _tokenCache.token;
    }

    const id = CLIENT_ID();
    const secret = CLIENT_SECRET();
    if (!id || !secret) {
        throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${id}:${secret}`).toString('base64');
    const res = await fetch(`${API_BASE()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PayPal OAuth failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    // expires_in is seconds; cache with 60s safety margin
    _tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return data.access_token;
}

/* ───────── Orders v2 ───────── */

/**
 * Create a PayPal Order (intent: CAPTURE).
 *
 * @param {object} opts
 * @param {string} opts.merchantTradeNo - our internal order ID
 * @param {number} opts.twdPrice
 * @param {string} opts.itemName
 * @param {string} opts.description
 * @param {string} opts.returnUrl
 * @param {string} opts.cancelUrl
 * @returns {Promise<{ id: string, status: string, amount: { value: string, currency: string } }>}
 */
export async function createPaypalOrder({
    merchantTradeNo,
    twdPrice,
    itemName,
    description,
    returnUrl,
    cancelUrl,
}) {
    const token = await getAccessToken();
    const amount = convertTwdToPaypalAmount(twdPrice);

    const body = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                reference_id: merchantTradeNo,
                custom_id: merchantTradeNo,
                description: (description || itemName).slice(0, 127),
                amount: {
                    currency_code: amount.currency,
                    value: amount.value,
                },
            },
        ],
        application_context: {
            brand_name: 'Dori & Rito Happydays',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
        },
    };

    const res = await fetch(`${API_BASE()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            // Idempotency: re-using merchantTradeNo so retries don't double-create.
            'PayPal-Request-Id': `create-${merchantTradeNo}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PayPal createOrder failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return { id: data.id, status: data.status, amount };
}

/**
 * Capture a PayPal Order after buyer approval.
 *
 * @param {string} paypalOrderId
 * @returns {Promise<{ status: string, captureId: string|null, amount: { value: string, currency: string }|null, customId: string|null, raw: object }>}
 */
export async function capturePaypalOrder(paypalOrderId) {
    const token = await getAccessToken();

    const res = await fetch(`${API_BASE()}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `capture-${paypalOrderId}`,
        },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(`PayPal capture failed: ${res.status} ${JSON.stringify(data)}`);
    }

    const unit = data.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    return {
        status: data.status,
        captureId: capture?.id || null,
        amount: capture?.amount
            ? { value: capture.amount.value, currency: capture.amount.currency_code }
            : null,
        customId: unit?.custom_id || unit?.reference_id || null,
        raw: data,
    };
}

/**
 * Get a PayPal Order — used by webhook handler to look up reference_id
 * when the webhook event payload doesn't include it directly.
 */
export async function getPaypalOrder(paypalOrderId) {
    const token = await getAccessToken();
    const res = await fetch(`${API_BASE()}/v2/checkout/orders/${paypalOrderId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PayPal getOrder failed: ${res.status} ${text}`);
    }
    return res.json();
}

/* ───────── Webhook signature verification ───────── */

/**
 * Verify a PayPal webhook event using PayPal's verify-webhook-signature endpoint.
 *
 * @param {object} headers - request headers (lower-case keys)
 * @param {object} eventBody - parsed webhook event JSON
 * @returns {Promise<boolean>}
 */
export async function verifyPaypalWebhook(headers, eventBody) {
    const webhookId = WEBHOOK_ID();
    if (!webhookId) {
        console.warn('[paypal] PAYPAL_WEBHOOK_ID not set — skipping verification');
        return false;
    }

    const token = await getAccessToken();

    const payload = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: eventBody,
    };

    const res = await fetch(`${API_BASE()}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.verification_status === 'SUCCESS';
}
