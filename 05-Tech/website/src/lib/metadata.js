import { routing } from '@/i18n/routing';
import { BRAND } from '@/lib/constants';

export function buildAlternates({ locale, path = '/' }) {
    const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
    const base = BRAND.siteUrl.replace(/\/$/, '');

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
