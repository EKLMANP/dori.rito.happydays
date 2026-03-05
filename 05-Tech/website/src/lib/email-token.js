/**
 * HMAC-based email confirmation token utility.
 * No database required — tokens are self-verifying.
 */

import { createHmac } from 'crypto';

const TOKEN_EXPIRY_HOURS = 48;

/**
 * Get the signing secret from environment variables.
 * Uses the secret portion of the Ghost Admin API key.
 */
function getSecret() {
    const key = process.env.GHOST_ADMIN_API_KEY || '';
    const secret = key.split(':')[1];
    if (!secret) {
        throw new Error('GHOST_ADMIN_API_KEY not configured — cannot generate tokens');
    }
    return secret;
}

/**
 * Generate a confirmation token for an email address.
 * @param {string} email
 * @returns {{ token: string, expires: number }}
 */
export function generateConfirmationToken(email) {
    const expires = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_HOURS * 3600;
    const data = `${email.toLowerCase()}|${expires}`;
    const token = createHmac('sha256', getSecret()).update(data).digest('hex');
    return { token, expires };
}

/**
 * Verify a confirmation token.
 * @param {string} email
 * @param {string} token
 * @param {number} expires - Unix timestamp
 * @returns {{ valid: boolean, reason?: string }}
 */
export function verifyConfirmationToken(email, token, expires) {
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) {
        return { valid: false, reason: 'expired' };
    }

    // Recompute HMAC and compare
    const data = `${email.toLowerCase()}|${expires}`;
    const expected = createHmac('sha256', getSecret()).update(data).digest('hex');

    if (token !== expected) {
        return { valid: false, reason: 'invalid' };
    }

    return { valid: true };
}
