import GhostContentAPI from '@tryghost/content-api';

// ---------------------------------------------------------------------------
// Locale helpers
// Ghost internal tag slugs for language detection.
// In Ghost, internal tags (#name) are stored with slugs starting with "hash-".
// ---------------------------------------------------------------------------
const LOCALE_TAG_SLUG = {
    'zh-TW': 'hash-lang-zh-tw',
    'en': 'hash-lang-en',
};

function getLocaleTagSlug(locale) {
    return LOCALE_TAG_SLUG[locale] || 'hash-lang-zh-tw';
}

/**
 * Infer the language of a post from its tags.
 * Posts with no lang tag are treated as zh-TW (migration fallback).
 */
function getPostLocale(post) {
    if (!post?.tags) return 'zh-TW';
    for (const [locale, tagSlug] of Object.entries(LOCALE_TAG_SLUG)) {
        if (post.tags.some(t => t.slug === tagSlug)) return locale;
    }
    return 'zh-TW';
}

/**
 * Return the #pair-xxx tag slug from a post, if any.
 * Paired posts share the same pair tag across languages.
 */
function getPairTagSlug(post) {
    return post?.tags?.find(t => t.slug?.startsWith('hash-pair-'))?.slug ?? null;
}

// ---------------------------------------------------------------------------

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
 * Rewrite Ghost image URLs from old domains to self-hosted VPS Ghost.
 * Ghost API may return image URLs pointing to old ghost.io or zeabur.app domains.
 */
const OLD_GHOST_HOSTS = [
    /https:\/\/doriritohappydays\.ghost\.io/g,
    /https:\/\/doriritohappydays\.zeabur\.app/g,
];

function rewriteImageUrls(post) {
    if (!post) return post;
    const ghostUrl = process.env.GHOST_URL;
    if (!ghostUrl) return post;

    const rewrite = (str) => {
        if (!str) return str;
        for (const pattern of OLD_GHOST_HOSTS) {
            str = str.replace(pattern, ghostUrl);
        }
        return str;
    };

    if (post.feature_image) post.feature_image = rewrite(post.feature_image);
    if (post.html) post.html = rewrite(post.html);
    if (post.og_image) post.og_image = rewrite(post.og_image);
    if (post.twitter_image) post.twitter_image = rewrite(post.twitter_image);
    return post;
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
// options.locale — filters to posts tagged with the matching #lang-xxx internal tag
// options.tag    — additional public tag slug to filter by
export async function getPosts(options = {}) {
    const api = getApi();
    if (!api) return { posts: [], meta: { pagination: { total: 0, pages: 1 } } };

    const localeTag = options.locale ? getLocaleTagSlug(options.locale) : null;
    let filter;
    if (localeTag && options.tag) {
        filter = `tag:${localeTag}+tag:${options.tag}`;
    } else if (localeTag) {
        filter = `tag:${localeTag}`;
    } else if (options.tag) {
        filter = `tag:${options.tag}`;
    }

    try {
        const posts = await withRetry(() =>
            api.posts.browse({
                limit: options.limit || 'all',
                page: options.page || 1,
                filter,
                include: 'tags,authors',
                order: 'published_at DESC',
            })
        );
        return { posts: posts.map(rewriteImageUrls), meta: posts.meta };
    } catch (err) {
        console.error('Ghost getPosts error:', err?.message || err);
        return { posts: [], meta: { pagination: { total: 0, pages: 1 } } };
    }
}

/**
 * 取得單篇文章（文章內頁用）
 *
 * Without locale: returns the post directly (backward-compatible).
 *
 * With locale, returns one of:
 *   { post, isFallback: false }             — post belongs to requested locale ✓
 *   { post, isFallback: true }              — no paired version; showing fallback content
 *   { shouldRedirect: true, targetSlug }    — slug belongs to different locale; caller should redirect
 *   null                                    — post not found at all
 */
export async function getPostBySlug(slug, locale) {
    const api = getApi();
    if (!api) return null;
    try {
        const post = await withRetry(() =>
            api.posts.read({ slug }, { include: 'tags,authors' })
        );
        if (!post) return null;

        const rewritten = rewriteImageUrls(post);

        // No locale check requested → backward-compatible return
        if (!locale) return rewritten;

        const postLocale = getPostLocale(post);

        // Post belongs to the right locale ✓
        if (postLocale === locale) return { post: rewritten, isFallback: false };

        // Wrong locale — try to find the paired version in the target locale
        const pairTagSlug = getPairTagSlug(post);
        if (pairTagSlug) {
            try {
                const paired = await withRetry(() =>
                    api.posts.browse({
                        limit: 1,
                        filter: `tag:${pairTagSlug}+tag:${getLocaleTagSlug(locale)}`,
                        fields: 'slug',
                    })
                );
                if (paired?.length > 0) {
                    return { shouldRedirect: true, targetSlug: paired[0].slug };
                }
            } catch { /* paired post not found; fall through to fallback */ }
        }

        // No paired version exists → show fallback with a banner
        return { post: rewritten, isFallback: true };
    } catch (err) {
        console.error(`Ghost getPostBySlug(${slug}) error:`, err?.message || err);
        return null;
    }
}

/**
 * Given a post and a target locale, return the slug of the paired version.
 * Returns null if no pair exists or Ghost is unavailable.
 */
export async function getPairedSlug(post, targetLocale) {
    const api = getApi();
    if (!api || !post) return null;
    const pairTagSlug = getPairTagSlug(post);
    if (!pairTagSlug) return null;
    try {
        const paired = await withRetry(() =>
            api.posts.browse({
                limit: 1,
                filter: `tag:${pairTagSlug}+tag:${getLocaleTagSlug(targetLocale)}`,
                fields: 'slug',
            })
        );
        return paired?.[0]?.slug ?? null;
    } catch {
        return null;
    }
}

/**
 * 取得所有文章的 slug（用於 generateStaticParams）
 * Returns [{ slug, locale }] where locale is inferred from #lang-xxx tags.
 * Posts without a lang tag are treated as 'zh-TW' (migration fallback).
 */
export async function getAllPostSlugs() {
    const api = getApi();
    if (!api) return [];
    try {
        const posts = await withRetry(() =>
            api.posts.browse({ limit: 'all', include: 'tags', fields: 'slug,id' })
        );
        return posts.map((p) => ({ slug: p.slug, locale: getPostLocale(p) }));
    } catch (err) {
        console.error('Ghost getAllPostSlugs error:', err?.message || err);
        return [];
    }
}

/**
 * 取得所有文章 + locale + pairing 資訊（用於 sitemap）
 * Returns [{ slug, locale, pairedSlugs: { 'zh-TW': slug, 'en': slug } }]
 * Computed entirely in JS from one API call (no N+1 queries).
 */
export async function getAllPostsForSitemap() {
    const api = getApi();
    if (!api) return [];
    try {
        const posts = await withRetry(() =>
            api.posts.browse({ limit: 'all', include: 'tags', fields: 'slug,id' })
        );

        // Build pairKey → { locale: slug } map
        const pairMap = {};
        for (const post of posts) {
            const pairKey = getPairTagSlug(post);
            if (pairKey) {
                if (!pairMap[pairKey]) pairMap[pairKey] = {};
                pairMap[pairKey][getPostLocale(post)] = post.slug;
            }
        }

        return posts.map((post) => {
            const pairKey = getPairTagSlug(post);
            return {
                slug: post.slug,
                locale: getPostLocale(post),
                pairedSlugs: pairKey ? pairMap[pairKey] : {},
            };
        });
    } catch (err) {
        console.error('Ghost getAllPostsForSitemap error:', err?.message || err);
        return [];
    }
}

// 取得相關文章（按 Tag 重疊度排序）
// locale — when provided, only returns posts in the same language
export async function getRelatedPosts(slug, tags, locale) {
    const api = getApi();
    if (!api || !Array.isArray(tags) || tags.length === 0) return [];

    // Only use public (non-internal) tags
    const publicTags = tags.filter(t => t.visibility === 'public' && !t.name.startsWith('#'));
    if (publicTags.length === 0) return [];

    // Match by tag NAME (not slug) — Ghost can have duplicate tags
    // with different slugs (e.g. "吠叫" → fei-jiao vs fei-jiao-2)
    const tagNames = new Set(publicTags.map(t => t.name));

    try {
        // Fetch all posts with tags, then filter/sort in JS
        // (Ghost OR filter with Chinese tag slugs can be unreliable)
        const localeFilter = locale ? `tag:${getLocaleTagSlug(locale)}` : undefined;
        const allPosts = await withRetry(() =>
            api.posts.browse({
                limit: 'all',
                filter: localeFilter,
                include: 'tags',
                order: 'published_at DESC',
            })
        );

        // Score each post by number of overlapping tags, exclude current post
        const scored = [];
        for (const post of allPosts) {
            if (post.slug === slug) continue;
            const postTagNames = (post.tags || [])
                .filter(t => t.visibility === 'public' && !t.name.startsWith('#'))
                .map(t => t.name);
            const overlap = postTagNames.filter(n => tagNames.has(n)).length;
            if (overlap > 0) {
                scored.push({ ...post, _overlap: overlap });
            }
        }

        // Sort by overlap (desc), then by published date (desc)
        scored.sort((a, b) => {
            if (b._overlap !== a._overlap) return b._overlap - a._overlap;
            return new Date(b.published_at) - new Date(a.published_at);
        });

        return scored.map(rewriteImageUrls);
    } catch (err) {
        console.error('Ghost getRelatedPosts error:', err?.message || err);
        return [];
    }
}

// 取得最新 N 篇文章（首頁用）
// locale — when provided, only returns posts in the matching language
export async function getLatestPosts(limit = 3, locale) {
    const api = getApi();
    if (!api) return [];
    try {
        const posts = await withRetry(() =>
            api.posts.browse({
                limit,
                filter: locale ? `tag:${getLocaleTagSlug(locale)}` : undefined,
                include: 'tags',
                order: 'published_at DESC',
            })
        );
        return posts.map(rewriteImageUrls);
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
