import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['zh-TW', 'en'],
    defaultLocale: 'zh-TW',
    localePrefix: 'always',
    localeDetection: true,
    localeCookie: {
        name: 'NEXT_LOCALE',
        maxAge: 60 * 60 * 24 * 365,
    },
});
