/**
 * Simple in-memory TTL cache for expensive API calls (e.g. Notion).
 * Each key stores a { data, ts } entry; stale entries are re-fetched.
 *
 * Usage:
 *   const customers = await cached('notion-customers', 5 * 60_000, () => fetchFromNotion());
 */

const store = new Map();

/**
 * @param {string} key   - unique cache key
 * @param {number} ttlMs - time-to-live in milliseconds
 * @param {() => Promise<T>} fetchFn - async function that fetches fresh data
 * @returns {Promise<T>}
 */
export async function cached(key, ttlMs, fetchFn) {
    const entry = store.get(key);
    if (entry && Date.now() - entry.ts < ttlMs) {
        return entry.data;
    }

    const data = await fetchFn();
    store.set(key, { data, ts: Date.now() });
    return data;
}

/** Manually invalidate a cache key */
export function invalidateCache(key) {
    store.delete(key);
}
