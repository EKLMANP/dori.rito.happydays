import { routing } from '@/i18n/routing';
import { BRAND } from '@/lib/constants';

/**
 * Build hreflang alternates for a page.
 *
 * Default mode (all other pages):
 *   buildAlternates({ locale, path: '/blog' })
 *   → same path for all locales, e.g. /zh-TW/blog and /en/blog
 *
 * Blog post mode (paired articles):
 *   buildAlternates({ locale, slugsByLocale: { 'zh-TW': 'dog-zh', 'en': 'dog-en' } })
 *   → each locale points to its own slug: /zh-TW/blog/dog-zh and /en/blog/dog-en
 *   → locales missing from slugsByLocale are omitted from alternates
 */
export function buildAlternates({ locale, path = '/', slugsByLocale }) {
    const base = BRAND.siteUrl.replace(/\/$/, '');

    if (slugsByLocale) {
        // Blog post mode: per-locale slugs
        const languages = {};
        for (const l of routing.locales) {
            const slug = slugsByLocale[l];
            if (slug) {
                languages[l] = `${base}/${l}/blog/${slug}`;
            }
        }
        const xDefault = languages[routing.defaultLocale] ?? Object.values(languages)[0];
        if (xDefault) languages['x-default'] = xDefault;

        const canonical = `${base}/${locale}/blog/${slugsByLocale[locale] ?? path.split('/').pop()}`;
        return { canonical, languages };
    }

    // Default mode: same path for all locales
    const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
    const languages = {};
    for (const l of routing.locales) {
        languages[l] = `${base}/${l}${cleanPath}`;
    }
    languages['x-default'] = `${base}/${routing.defaultLocale}${cleanPath}`;

    return {
        canonical: `${base}/${locale}${cleanPath}`,
        languages,
    };
}
