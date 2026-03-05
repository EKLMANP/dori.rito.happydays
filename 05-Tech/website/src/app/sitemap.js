import { getAllPostSlugs } from '@/lib/ghost';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';

// Static pages
const STATIC_PAGES = [
    { url: SITE_URL, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/about`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/services`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/blog`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${SITE_URL}/contact`, priority: 0.7, changeFrequency: 'monthly' },
];

export default async function sitemap() {
    let blogPages = [];

    try {
        const slugs = await getAllPostSlugs();
        blogPages = slugs.map(({ slug }) => ({
            url: `${SITE_URL}/blog/${slug}`,
            priority: 0.8,
            changeFrequency: 'monthly',
        }));
    } catch {
        // Ghost not yet deployed — return static pages only
    }

    return [...STATIC_PAGES, ...blogPages];
}
