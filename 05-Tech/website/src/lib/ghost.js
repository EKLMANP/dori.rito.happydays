import GhostContentAPI from '@tryghost/content-api';

// Lazy Ghost API initialization — only creates the client when the key is valid
// This prevents build errors when Ghost is not yet deployed
function getApi() {
    const url = process.env.GHOST_URL;
    const key = process.env.GHOST_CONTENT_API_KEY;

    if (!url || !key || key.startsWith('placeholder') || !/^[0-9a-f]{26}$/.test(key)) {
        return null;
    }

    try {
        return new GhostContentAPI({ url, key, version: 'v5.0' });
    } catch {
        return null;
    }
}

/**
 * Retry wrapper for Ghost API calls.
 * Zeabur free-tier Ghost can return 502 on cold starts.
 * Retries up to `maxRetries` times with exponential backoff.
 */
async function withRetry(fn, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            const is502 = err?.response?.status === 502 || err?.message?.includes('502');
            if (!is502 || attempt === maxRetries) throw err;
            const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
            console.warn(`Ghost API 502 — retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastError;
}

// 取得所有文章（列表頁用）
export async function getPosts(options = {}) {
    const api = getApi();
    if (!api) return { posts: [], meta: { pagination: { total: 0, pages: 1 } } };
    try {
        const posts = await withRetry(() =>
            api.posts.browse({
                limit: options.limit || 'all',
                page: options.page || 1,
                filter: options.tag ? `tag:${options.tag}` : undefined,
                include: 'tags,authors',
                order: 'published_at DESC',
            })
        );
        return { posts, meta: posts.meta };
    } catch (err) {
        console.error('Ghost getPosts error:', err?.message || err);
        return { posts: [], meta: { pagination: { total: 0, pages: 1 } } };
    }
}

// 取得單篇文章（文章內頁用）
export async function getPostBySlug(slug) {
    const api = getApi();
    if (!api) return null;
    try {
        const post = await withRetry(() =>
            api.posts.read({ slug }, { include: 'tags,authors' })
        );
        return post;
    } catch (err) {
        console.error(`Ghost getPostBySlug(${slug}) error:`, err?.message || err);
        return null;
    }
}

// 取得所有文章的 slug（用於 generateStaticParams）
export async function getAllPostSlugs() {
    const api = getApi();
    if (!api) return [];
    try {
        const posts = await withRetry(() =>
            api.posts.browse({ limit: 'all', fields: 'slug' })
        );
        return posts.map((p) => ({ slug: p.slug }));
    } catch (err) {
        console.error('Ghost getAllPostSlugs error:', err?.message || err);
        return [];
    }
}

// 取得相關文章（同 Tag）
export async function getRelatedPosts(slug, primaryTag, limit = 3) {
    const api = getApi();
    if (!api) return [];
    try {
        const posts = await withRetry(() =>
            api.posts.browse({
                limit,
                filter: primaryTag ? `tag:${primaryTag}+slug:-${slug}` : `slug:-${slug}`,
                include: 'tags',
                order: 'published_at DESC',
            })
        );
        return posts;
    } catch (err) {
        console.error('Ghost getRelatedPosts error:', err?.message || err);
        return [];
    }
}

// 取得最新 N 篇文章（首頁用）
export async function getLatestPosts(limit = 3) {
    const api = getApi();
    if (!api) return [];
    try {
        const posts = await withRetry(() =>
            api.posts.browse({
                limit,
                include: 'tags',
                order: 'published_at DESC',
            })
        );
        return posts;
    } catch (err) {
        console.error('Ghost getLatestPosts error:', err?.message || err);
        return [];
    }
}

// 取得所有 Tags
export async function getTags() {
    const api = getApi();
    if (!api) return [];
    try {
        const tags = await withRetry(() =>
            api.tags.browse({
                limit: 'all',
                include: 'count.posts',
                filter: 'visibility:public',
            })
        );
        return tags;
    } catch (err) {
        console.error('Ghost getTags error:', err?.message || err);
        return [];
    }
}
