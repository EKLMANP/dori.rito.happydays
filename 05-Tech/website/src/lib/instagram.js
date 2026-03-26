/**
 * Instagram Graph API client for follower statistics.
 *
 * Requires a Facebook Page connected to the IG Business Account.
 * Env: IG_ACCESS_TOKEN, IG_USER_ID
 */

const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const API_BASE = 'https://graph.facebook.com/v19.0';

/** Check if Instagram API is configured */
export function isIGConfigured() {
    return !!(IG_ACCESS_TOKEN && IG_USER_ID);
}

/** Get IG profile (followers_count, media_count, username) */
export async function getIGProfile() {
    if (!isIGConfigured()) return null;

    try {
        const url = `${API_BASE}/${IG_USER_ID}?fields=followers_count,media_count,username&access_token=${IG_ACCESS_TOKEN}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`[IG API] profile returned ${res.status}`);
            return null;
        }
        return res.json();
    } catch (err) {
        console.error('[IG API] profile error:', err.message);
        return null;
    }
}

/**
 * Get follower count insights for the last 30 days.
 * Note: Only available for Business/Creator accounts with Facebook Page.
 */
export async function getFollowerInsights() {
    if (!isIGConfigured()) return null;

    try {
        const url = `${API_BASE}/${IG_USER_ID}/insights?metric=follower_count&period=day&access_token=${IG_ACCESS_TOKEN}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`[IG API] insights returned ${res.status}`);
            return null;
        }
        return res.json();
    } catch (err) {
        console.error('[IG API] insights error:', err.message);
        return null;
    }
}
