/**
 * Ghost Migration Script
 * Copies posts from Ghost(Pro) to self-hosted Zeabur Ghost via API
 */

const crypto = require('crypto');

// === Source: Ghost(Pro) ===
const SOURCE_URL = 'https://doriritohappydays.ghost.io';
const SOURCE_CONTENT_KEY = '71676035c6736ede4f79ec6c7d';
const SOURCE_ADMIN_KEY = '69a04d5669d08100011ca931:61f0184e95ca0d29f50afd88389fc35c402291d1dc26f3820182efccb6fc1c0e';

// === Destination: Zeabur self-hosted Ghost ===
const DEST_URL = 'https://doriritohappydays.zeabur.app';
const DEST_ADMIN_KEY = '69a0fc249908a20001a33777:05527dd174bafadd6fd9e9e78eb57b04e6b4ecc1ec8f4b6edb87d73383b3921c';

function makeToken(adminKey, audience = '/admin/') {
    const [id, secret] = adminKey.split(':');
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: audience })).toString('base64url');
    const sig = crypto.createHmac('sha256', Buffer.from(secret, 'hex'))
        .update(`${header}.${payload}`)
        .digest('base64url');
    return `${header}.${payload}.${sig}`;
}

async function fetchSourcePosts() {
    // Use Content API to get all posts with full HTML
    const url = `${SOURCE_URL}/ghost/api/content/posts/?key=${SOURCE_CONTENT_KEY}&limit=all&include=tags,authors&formats=html,mobiledoc`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error('Failed to fetch source posts:', res.status, await res.text());
        return [];
    }
    const data = await res.json();
    return data.posts || [];
}

async function fetchSourcePages() {
    const url = `${SOURCE_URL}/ghost/api/content/pages/?key=${SOURCE_CONTENT_KEY}&limit=all&formats=html,mobiledoc`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error('Failed to fetch source pages:', res.status);
        return [];
    }
    const data = await res.json();
    return data.pages || [];
}

async function fetchSourceTags() {
    const url = `${SOURCE_URL}/ghost/api/content/tags/?key=${SOURCE_CONTENT_KEY}&limit=all`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.tags || [];
}

async function createDestTag(tag) {
    const token = makeToken(DEST_ADMIN_KEY);
    const res = await fetch(`${DEST_URL}/ghost/api/admin/tags/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Ghost ${token}`,
            'Accept-Version': 'v5.0',
        },
        body: JSON.stringify({
            tags: [{
                name: tag.name,
                slug: tag.slug,
                description: tag.description || null,
            }],
        }),
    });
    if (res.ok) {
        const data = await res.json();
        console.log(`  ✅ Tag created: ${tag.name}`);
        return data.tags[0];
    } else {
        const err = await res.json();
        if (err?.errors?.[0]?.message?.includes('already exists')) {
            console.log(`  ℹ️ Tag already exists: ${tag.name}`);
            // Fetch existing tag
            const existingRes = await fetch(`${DEST_URL}/ghost/api/admin/tags/slug/${tag.slug}/`, {
                headers: { Authorization: `Ghost ${makeToken(DEST_ADMIN_KEY)}`, 'Accept-Version': 'v5.0' },
            });
            if (existingRes.ok) {
                const d = await existingRes.json();
                return d.tags[0];
            }
        } else {
            console.error(`  ❌ Tag create failed: ${tag.name}`, JSON.stringify(err));
        }
    }
    return null;
}

async function createDestPost(post, tagMap) {
    const token = makeToken(DEST_ADMIN_KEY);

    // Map tags to destination tag objects
    const tags = (post.tags || []).map(t => {
        const destTag = tagMap.get(t.slug);
        return destTag ? { id: destTag.id } : { name: t.name, slug: t.slug };
    });

    const postData = {
        title: post.title,
        slug: post.slug,
        html: post.html,
        status: post.status || 'published',
        feature_image: post.feature_image || null,
        featured: post.featured || false,
        published_at: post.published_at,
        meta_title: post.meta_title || null,
        meta_description: post.meta_description || null,
        excerpt: post.custom_excerpt || post.excerpt || null,
        custom_excerpt: post.custom_excerpt || null,
        tags: tags,
    };

    const res = await fetch(`${DEST_URL}/ghost/api/admin/posts/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Ghost ${token}`,
            'Accept-Version': 'v5.0',
        },
        body: JSON.stringify({
            posts: [postData],
            source: 'html',
        }),
    });

    if (res.ok) {
        const data = await res.json();
        console.log(`  ✅ Post migrated: "${post.title}"`);
        return data.posts[0];
    } else {
        const err = await res.json();
        if (err?.errors?.[0]?.message?.includes('already exists')) {
            console.log(`  ℹ️ Post already exists: "${post.title}"`);
        } else {
            console.error(`  ❌ Post failed: "${post.title}"`, JSON.stringify(err));
        }
    }
    return null;
}

async function main() {
    console.log('🚀 Ghost Migration: Ghost(Pro) → Zeabur Self-Hosted');
    console.log('====================================================\n');

    // Step 1: Migrate Tags
    console.log('📁 Step 1: Migrating Tags...');
    const sourceTags = await fetchSourceTags();
    console.log(`   Found ${sourceTags.length} tags on source`);

    const tagMap = new Map();
    for (const tag of sourceTags) {
        const destTag = await createDestTag(tag);
        if (destTag) tagMap.set(tag.slug, destTag);
    }

    // Step 2: Migrate Posts
    console.log('\n📝 Step 2: Migrating Posts...');
    const sourcePosts = await fetchSourcePosts();
    console.log(`   Found ${sourcePosts.length} posts on source`);

    for (const post of sourcePosts) {
        await createDestPost(post, tagMap);
    }

    // Step 3: Migrate Pages (if any)
    console.log('\n📄 Step 3: Migrating Pages...');
    const sourcePages = await fetchSourcePages();
    console.log(`   Found ${sourcePages.length} pages on source`);

    // Pages use the same Admin API endpoint but slightly different
    for (const page of sourcePages) {
        const token = makeToken(DEST_ADMIN_KEY);
        const pageData = {
            title: page.title,
            slug: page.slug,
            html: page.html,
            status: page.status || 'published',
            feature_image: page.feature_image || null,
            published_at: page.published_at,
        };

        const res = await fetch(`${DEST_URL}/ghost/api/admin/pages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Ghost ${token}`,
                'Accept-Version': 'v5.0',
            },
            body: JSON.stringify({ pages: [pageData], source: 'html' }),
        });

        if (res.ok) {
            console.log(`  ✅ Page migrated: "${page.title}"`);
        } else {
            const err = await res.json();
            console.log(`  ⚠️ Page: "${page.title}" — ${err?.errors?.[0]?.message || 'error'}`);
        }
    }

    console.log('\n✅ Migration complete!');
}

main().catch(console.error);
