import { getAllPostsForSitemap } from '@/lib/ghost';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com';
const LOCALES = ['zh-TW', 'en'];

const STATIC_PATHS = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/services', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.9, changeFrequency: 'daily' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
];

function localeEntries(path, priority, changeFrequency) {
    return LOCALES.map((locale) => ({
        url: `${SITE_URL}/${locale}${path}`,
        priority,
        changeFrequency,
        alternates: {
            languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
        },
    }));
}

export default async function sitemap() {
    const staticEntries = STATIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
        localeEntries(path, priority, changeFrequency)
    );

    let blogEntries = [];
    try {
        const posts = await getAllPostsForSitemap();
        // Each post is emitted only for its own locale.
        // If a paired slug exists, alternates.languages includes both locales.
        blogEntries = posts.map(({ slug, locale, pairedSlugs }) => {
            const languages = {};
            for (const [l, s] of Object.entries(pairedSlugs)) {
                languages[l] = `${SITE_URL}/${l}/blog/${s}`;
            }
            // Always include the post's own locale
            languages[locale] = `${SITE_URL}/${locale}/blog/${slug}`;
            return {
                url: `${SITE_URL}/${locale}/blog/${slug}`,
                priority: 0.8,
                changeFrequency: 'monthly',
                alternates: Object.keys(languages).length > 1 ? { languages } : undefined,
            };
        });
    } catch {
        // Ghost not yet deployed — return static pages only
    }

    return [...staticEntries, ...blogEntries];
}
