/**
 * Ghost Admin API client for member/subscriber statistics.
 * Uses JWT signing with the Admin API key.
 *
 * Env: GHOST_URL, GHOST_ADMIN_API_KEY (format: {id}:{secret})
 */

const GHOST_URL = process.env.GHOST_URL;
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY;

/** Create a JWT token for Ghost Admin API authentication */
async function createToken() {
    if (!GHOST_ADMIN_API_KEY || !GHOST_ADMIN_API_KEY.includes(':')) return null;

    const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
    const keyBuf = Buffer.from(secret, 'hex');

    // Build JWT manually (avoids jsonwebtoken dependency)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
        iat: now,
        exp: now + 300, // 5 min
        aud: '/admin/',
    })).toString('base64url');

    const { createHmac } = await import('crypto');
    const signature = createHmac('sha256', keyBuf)
        .update(`${header}.${payload}`)
        .digest('base64url');

    return `${header}.${payload}.${signature}`;
}

/** Make an authenticated request to the Ghost Admin API */
async function ghostAdmin(endpoint, params = {}) {
    if (!GHOST_URL || !GHOST_ADMIN_API_KEY) return null;

    const token = await createToken();
    if (!token) return null;

    const url = new URL(`/ghost/api/admin/${endpoint}`, GHOST_URL);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Ghost ${token}` },
        cache: 'no-store',
    });

    if (!res.ok) {
        console.error(`[Ghost Admin] ${endpoint} returned ${res.status}`);
        return null;
    }

    return res.json();
}

/** Get total member count */
export async function getMembersCount() {
    const data = await ghostAdmin('members/', { limit: 1, include: 'count' });
    return data?.meta?.pagination?.total ?? 0;
}

/** Get members created after a given ISO date string */
export async function getNewMembers(since) {
    const data = await ghostAdmin('members/', {
        limit: 'all',
        filter: `created_at:>='${since}'`,
        fields: 'id,created_at',
    });
    return data?.members?.length ?? 0;
}

/** Get members who unsubscribed (status changed) after a given date */
export async function getUnsubscribedCount(since) {
    const data = await ghostAdmin('members/', {
        limit: 'all',
        filter: `unsubscribed_at:>='${since}'`,
        fields: 'id,unsubscribed_at',
    });
    return data?.members?.length ?? 0;
}

/** Get members who signed up but haven't confirmed email */
export async function getUnconfirmedCount() {
    // Ghost marks unconfirmed members with status 'free' but email_disabled = true
    // Alternative: filter by status and check email verification
    const data = await ghostAdmin('members/', {
        limit: 'all',
        filter: `subscribed:false+status:free`,
        fields: 'id,created_at',
    });
    return data?.members?.length ?? 0;
}

/** Get new unconfirmed members since a given date */
export async function getNewUnconfirmedCount(since) {
    const data = await ghostAdmin('members/', {
        limit: 'all',
        filter: `subscribed:false+status:free+created_at:>='${since}'`,
        fields: 'id,created_at',
    });
    return data?.members?.length ?? 0;
}

/** Check if Ghost Admin API is configured */
export function isGhostAdminConfigured() {
    return !!(GHOST_URL && GHOST_ADMIN_API_KEY && GHOST_ADMIN_API_KEY.includes(':'));
}
