import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildAlternates } from '@/lib/metadata';
import ContactForm from '@/components/ContactForm';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.contact' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates({ locale, path: '/contact' }),
    };
}

export default async function ContactPage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('contact');

    return (
        <>
            {/* Hero */}
            <section className="hero-bg bg-paw-texture py-16 px-6 text-center relative overflow-hidden">
                <div className="absolute top-10 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
                <div className="container mx-auto max-w-2xl relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">{t('hero.title')}</h1>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">{t('hero.subtitle')}</p>
                </div>
            </section>

            {/* Collaboration Form */}
            <section className="bg-white py-16 px-6 relative z-10">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-gray-50 rounded-[48px] px-8 py-10 md:px-12 md:py-12 border border-gray-100 w-full md:w-1/2 mx-auto">
                        <ContactForm />
                    </div>
                </div>
            </section>
        </>
    );
}
