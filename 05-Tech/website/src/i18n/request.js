import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

const NAMESPACES = [
    'common',
    'home',
    'about',
    'services',
    'booking',
    'contact',
    'blog',
    'legal',
    'metadata',
    'email',
];

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

    const messages = {};
    for (const ns of NAMESPACES) {
        try {
            const mod = await import(`../messages/${locale}/${ns}.json`);
            messages[ns] = mod.default;
        } catch {
            messages[ns] = {};
        }
    }

    return { locale, messages };
});
