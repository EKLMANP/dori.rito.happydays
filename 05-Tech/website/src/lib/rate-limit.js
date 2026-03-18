/**
 * Simple In-Memory Rate Limiter
 *
 * Uses IP-based sliding window. Suitable for Vercel serverless
 * (each function instance has its own memory — this provides
 * per-instance rate limiting as a first layer of defense).
 *
 * For production at scale, consider using Vercel KV or Upstash Redis.
 */

const store = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, { timestamps }] of store) {
        const filtered = timestamps.filter(t => now - t < 600_000);
        if (filtered.length === 0) {
            store.delete(key);
        } else {
            store.set(key, { timestamps: filtered });
        }
    }
}, 300_000);

/**
 * Check rate limit for a given key.
 *
 * @param {string} key - Identifier (e.g., IP address)
 * @param {number} maxRequests - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
export function checkRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const entry = store.get(key) || { timestamps: [] };

    // Filter to only timestamps within the window
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        const resetMs = windowMs - (now - oldestInWindow);
        return { allowed: false, remaining: 0, resetMs };
    }

    entry.timestamps.push(now);
    store.set(key, entry);

    return {
        allowed: true,
        remaining: maxRequests - entry.timestamps.length,
        resetMs: 0,
    };
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );
}
