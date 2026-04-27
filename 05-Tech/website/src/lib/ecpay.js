/**
 * ECPay Embedded Checkout Integration
 *
 * Handles:
 * 1. Creating payment token for embedded checkout
 * 2. Verifying webhook CheckMacValue (SHA256)
 */

import { createHash } from 'crypto';

const MERCHANT_ID = () => process.env.ECPAY_MERCHANT_ID;
const HASH_KEY = () => process.env.ECPAY_HASH_KEY;
const HASH_IV = () => process.env.ECPAY_HASH_IV;
const API_URL = () => process.env.ECPAY_API_URL || 'https://payment-stage.ecpay.com.tw';

/**
 * Generate a MerchantTradeNo (unique order ID).
 * Format: DR{YYYYMMDD}-{random}
 */
export function generateTradeNo() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DR${date}${rand}`;
}

/**
 * Format date for ECPay (yyyy/MM/dd HH:mm:ss).
 */
function formatECPayDate(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Generate CheckMacValue for ECPay request parameters.
 * Algorithm: SHA256
 */
export function generateCheckMacValue(params) {
    const hashKey = HASH_KEY();
    const hashIV = HASH_IV();

    // Sort params alphabetically by key
    const sorted = Object.keys(params)
        .filter(k => k !== 'CheckMacValue')
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('&');

    const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;

    // URL encode then lowercase
    const encoded = encodeURIComponent(raw)
        .toLowerCase()
        .replace(/%2d/g, '-')
        .replace(/%5f/g, '_')
        .replace(/%2e/g, '.')
        .replace(/%21/g, '!')
        .replace(/%2a/g, '*')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%20/g, '+');

    return createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

/**
 * Verify ECPay webhook CheckMacValue.
 *
 * @param {object} params - All webhook POST parameters
 * @returns {boolean} Whether the signature is valid
 */
export function verifyCheckMacValue(params) {
    const received = params.CheckMacValue;
    if (!received) return false;

    const expected = generateCheckMacValue(params);
    return received.toUpperCase() === expected.toUpperCase();
}

/**
 * Create an ECPay AIO payment form for client-side submission.
 *
 * Generates an HTML form with all required parameters + CheckMacValue.
 * The client renders this form and submits it, which redirects the user
 * to ECPay's payment page. After payment, ECPay redirects to clientBackUrl.
 *
 * This is the standard ECPay AIO integration pattern:
 *   Server generates signed form → Client submits → ECPay processes → Redirect back
 *
 * @param {object} options
 * @param {string} options.merchantTradeNo - Unique order ID
 * @param {number} options.totalAmount - Payment amount (integer)
 * @param {string} options.itemName - Item description
 * @param {string} options.tradeDesc - Trade description
 * @param {string} options.returnUrl - Webhook URL for payment result (server-to-server)
 * @param {string} options.clientBackUrl - URL to redirect client after payment
 * @returns {{ html: string, merchantTradeNo: string }}
 */
export async function createPaymentOrder({
    merchantTradeNo,
    totalAmount,
    itemName,
    tradeDesc,
    returnUrl,
    clientBackUrl,
}) {
    const merchantId = MERCHANT_ID();
    const apiUrl = API_URL();

    if (!merchantId || !HASH_KEY() || !HASH_IV()) {
        throw new Error('ECPay credentials not configured');
    }

    const params = {
        MerchantID: merchantId,
        MerchantTradeNo: merchantTradeNo,
        MerchantTradeDate: formatECPayDate(),
        PaymentType: 'aio',
        TotalAmount: String(totalAmount),
        TradeDesc: tradeDesc,
        ItemName: itemName,
        ReturnURL: returnUrl,
        ClientBackURL: clientBackUrl,
        ChoosePayment: 'ALL',
        EncryptType: '1',
    };

    params.CheckMacValue = generateCheckMacValue(params);

    // Generate HTML form for client-side submission to ECPay
    const actionUrl = `${apiUrl}/Cashier/AioCheckOut/V5`;
    const formInputs = Object.entries(params)
        .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}" />`)
        .join('\n');

    const html = `<form id="ecpay-checkout" method="POST" action="${escapeHtml(actionUrl)}">${formInputs}</form>`;

    return { html, merchantTradeNo };
}

/** Escape HTML special characters for safe attribute insertion. */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
