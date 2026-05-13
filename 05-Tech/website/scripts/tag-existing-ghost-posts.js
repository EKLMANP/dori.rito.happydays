#!/usr/bin/env node
/**
 * Migration script: Add #lang-zh-tw internal tag to all existing Ghost posts
 * that are missing a language tag.
 *
 * Usage:
 *   GHOST_URL=https://your-ghost.com GHOST_ADMIN_KEY=id:secret node scripts/tag-existing-ghost-posts.js
 *
 * Optional flag:
 *   --dry-run   Print what would be changed without writing to Ghost
 *
 * Requirements:
 *   npm install node-fetch  (or use Node 18+ built-in fetch)
 *
 * What it does:
 *   1. Lists all posts via Admin API
 *   2. Identifies posts missing #lang-zh-tw / #lang-en tags
 *   3. Adds #lang-zh-tw to those posts (assumes all existing posts are zh-TW)
 *   4. Reports a summary
 *
 * After running this, manually add #pair-<key> tags in Ghost to link
 * translated article pairs (e.g. #pair-dog-barking on both zh and en versions).
 */

const crypto = require('crypto');

const GHOST_URL = process.env.GHOST_URL?.replace(/\/$/, '');
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!GHOST_URL || !GHOST_ADMIN_KEY) {
    console.error('❌  Missing env vars: GHOST_URL and GHOST_ADMIN_KEY are required.');
    process.exit(1);
}

// ─── JWT helper ─────────────────────────────────────────────────────────────
function makeAdminToken() {
    const [id, secret] = GHOST_ADMIN_KEY.split(':');
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
    const signature = crypto
        .createHmac('sha256', Buffer.from(secret, 'hex'))
        .update(`${header}.${payload}`)
        .digest('base64url');
    return `${header}.${payload}.${signature}`;
}

async function ghostFetch(path, options = {}) {
    const token = makeAdminToken();
    const res = await fetch(`${GHOST_URL}/ghost/api/admin/${path}`, {
        ...options,
        headers: {
            Authorization: `Ghost ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Ghost API ${res.status}: ${body}`);
    }
    return res.json();
}

// ─── Main ────────────────────────────────────────────────────────────────────
const LANG_TAG_NAMES = new Set(['#lang-zh-tw', '#lang-en']);

async function run() {
    console.log(`🔍  Fetching all posts from ${GHOST_URL}…`);

    // Fetch posts with tags (paginate if needed)
    let allPosts = [];
    let page = 1;
    while (true) {
        const { posts, meta } = await ghostFetch(`posts/?limit=100&page=${page}&include=tags`);
        allPosts = allPosts.concat(posts);
        if (page >= meta.pagination.pages) break;
        page++;
    }

    console.log(`📄  Total posts: ${allPosts.length}`);

    // Find posts missing a lang tag
    const needsTag = allPosts.filter(post =>
        !post.tags?.some(t => LANG_TAG_NAMES.has(t.name?.toLowerCase()))
    );

    if (needsTag.length === 0) {
        console.log('✅  All posts already have a language tag. Nothing to do.');
        return;
    }

    console.log(`\n⚠️   Posts missing a lang tag: ${needsTag.length}`);
    needsTag.forEach(p => console.log(`   - [${p.id}] ${p.title} (${p.slug})`));

    if (DRY_RUN) {
        console.log('\n🚧  Dry-run mode — no changes written.');
        return;
    }

    // Fetch or create the #lang-zh-tw tag
    console.log('\n🏷️   Resolving #lang-zh-tw tag…');
    let langTag;
    try {
        const { tags } = await ghostFetch('tags/?limit=all&filter=slug:hash-lang-zh-tw');
        langTag = tags[0];
    } catch { /* tag doesn't exist yet */ }

    if (!langTag) {
        const { tags } = await ghostFetch('tags/', {
            method: 'POST',
            body: JSON.stringify({ tags: [{ name: '#lang-zh-tw', slug: 'hash-lang-zh-tw', visibility: 'internal' }] }),
        });
        langTag = tags[0];
        console.log(`   Created tag: ${langTag.name} (id: ${langTag.id})`);
    } else {
        console.log(`   Found existing tag: ${langTag.name} (id: ${langTag.id})`);
    }

    // Add the tag to each post
    let updated = 0;
    let failed = 0;
    for (const post of needsTag) {
        try {
            const existingTagIds = (post.tags || []).map(t => ({ id: t.id }));
            await ghostFetch(`posts/${post.id}/`, {
                method: 'PUT',
                body: JSON.stringify({
                    posts: [{
                        updated_at: post.updated_at,
                        tags: [...existingTagIds, { id: langTag.id }],
                    }],
                }),
            });
            console.log(`   ✓ Tagged: ${post.title}`);
            updated++;
        } catch (err) {
            console.error(`   ✗ Failed: ${post.title} — ${err.message}`);
            failed++;
        }
    }

    console.log(`\n📊  Done. Updated: ${updated}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

run().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
