import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { BRAND } from '@/lib/constants';
import { buildAlternates } from '@/lib/metadata';
import LocaleHtmlLang from '@/components/LocaleHtmlLang';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.root' });

    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com'),
        title: {
            default: t('titleDefault'),
            template: `%s | ${BRAND.nameShort}`,
        },
        description: t('description'),
        keywords: t('keywords').split('|'),
        authors: [{ name: BRAND.nameShort }],
        creator: BRAND.nameShort,
        openGraph: {
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'zh_TW',
            siteName: BRAND.name,
            title: t('titleDefault'),
            description: t('description'),
        },
        twitter: {
            card: 'summary_large_image',
            title: t('titleDefault'),
            description: t('description'),
        },
        robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
        },
        alternates: buildAlternates({ locale, path: '/' }),
    };
}

export default async function LocaleLayout({ children, params }) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <LocaleHtmlLang locale={locale} />
            {children}
        </NextIntlClientProvider>
    );
}
