import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint for Ghost CMS webhooks.
 *
 * Ghost sends a POST when a post is published/updated/deleted.
 * This clears the ISR cache so the frontend reflects changes immediately.
 *
 * Usage: Configure a Ghost webhook to POST to:
 *   https://doriritohappydays.com/api/revalidate?secret=<GHOST_WEBHOOK_SECRET>
 *
 * Events to subscribe: "Post published", "Post updated", "Post deleted"
 */
export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (!process.env.GHOST_WEBHOOK_SECRET) {
        console.error('[Revalidate] GHOST_WEBHOOK_SECRET not configured');
        return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    if (secret !== process.env.GHOST_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    try {
        // Ghost webhook payload: { post: { current: { slug, title, ... } } }
        const body = await request.json().catch(() => null);
        const slug = body?.post?.current?.slug;

        // Revalidate homepage (shows latest posts) and blog listing
        revalidatePath('/');
        revalidatePath('/blog');

        // Revalidate the specific post page if slug is available
        if (slug) {
            revalidatePath(`/blog/${slug}`);
        }

        console.log(`[Revalidate] Success — slug: ${slug || '(none)'}`);
        return NextResponse.json({ revalidated: true, slug: slug || null });
    } catch (err) {
        console.error('[Revalidate] Error:', err);
        return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
    }
}
