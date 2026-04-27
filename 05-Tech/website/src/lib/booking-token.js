/**
 * Booking HMAC Token
 *
 * Generates and verifies HMAC tokens for CSRF protection on booking forms.
 * Token = HMAC-SHA256(secret, payload + timestamp)
 */

import { createHmac } from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-booking-secret';
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a booking CSRF token.
 * @param {string} payload - Data to bind (e.g., service_id + slot)
 * @returns {{ token: string, timestamp: number }}
 */
export function generateBookingToken(payload) {
    const timestamp = Date.now();
    const data = `${payload}:${timestamp}`;
    const token = createHmac('sha256', SECRET).update(data).digest('hex');
    return { token, timestamp };
}

/**
 * Verify a booking CSRF token.
 * @param {string} token - The HMAC token
 * @param {string} payload - Original payload
 * @param {number} timestamp - Original timestamp
 * @returns {boolean}
 */
export function verifyBookingToken(token, payload, timestamp) {
    if (!token || !payload || !timestamp) return false;

    // Check expiry
    if (Date.now() - timestamp > TOKEN_TTL_MS) return false;

    const data = `${payload}:${timestamp}`;
    const expected = createHmac('sha256', SECRET).update(data).digest('hex');
    return token === expected;
}

/**
 * Generate a repay token for the "重新選擇付款方式" email button.
 * Bound to merchantTradeNo only — no timestamp; expiry is enforced by
 * checking processed_orders.payment_expire_at server-side.
 */
export function generateRepayToken(merchantTradeNo) {
    return createHmac('sha256', SECRET).update(`repay:${merchantTradeNo}`).digest('hex');
}

export function verifyRepayToken(token, merchantTradeNo) {
    if (!token || !merchantTradeNo) return false;
    const expected = createHmac('sha256', SECRET).update(`repay:${merchantTradeNo}`).digest('hex');
    return token === expected;
}
