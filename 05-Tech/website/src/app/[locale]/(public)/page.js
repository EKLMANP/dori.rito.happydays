import { getLatestPosts } from '@/lib/ghost';
import { localBusinessSchema, faqSchema } from '@/lib/schema';
import { getFAQS, getPricingPlans, getTestimonials } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import { buildAlternates } from '@/lib/metadata';
import NewsletterCTA from '@/components/NewsletterCTA';
import FAQSection from '@/components/FAQSection';
import BlogCard from '@/components/BlogCard';
import { InnerHtml, JsonLd } from '@/components/InnerHtml';
import { Link } from '@/i18n/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.home' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates({ locale, path: '/' }),
    };
}

export const revalidate = 60;

export default async function HomePage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations({ locale, namespace: 'home' });
    const latestPosts = await getLatestPosts(3, locale);
    const faqs = getFAQS(locale);
    const pricingPlans = getPricingPlans(locale);
    const testimonials = getTestimonials(locale);
    const jsonLd = [localBusinessSchema(), faqSchema(faqs)];

    const expectations = t.raw('expectations.items');
    const flowSteps = t.raw('flow.steps');
    const philosophyItems = t.raw('philosophy.items');
    const aboutBoxItems = t.raw('about.boxItems');
    const guaranteeItems = t.raw('guarantee.items');

    return (
        <>
            {jsonLd.map((schema, i) => (
                <JsonLd key={i} data={schema} />
            ))}

            {/* Hero */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden hero-bg bg-paw-texture">
                <div className="absolute top-20 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
                <div className="absolute inset-0 md:hidden pointer-events-none">
                    <img src="https://iili.io/qfrfmxf.jpg" className="w-full h-full object-cover" alt="Mobile Background" />
                    <div className="absolute inset-0 bg-white/75" />
                </div>

                <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 items-center gap-10 py-16 relative z-10">
                    <div className="order-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="bg-orange-100 text-brand-orange px-6 py-2 rounded-full inline-block font-black mb-10 tracking-widest text-sm sm:text-base shadow-sm">
                            {t('hero.badge')}
                        </div>
                        <h1 className="flex flex-col gap-3 md:gap-5 mb-10">
                            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">{t('hero.headline1')}</span>
                            <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-orange bg-orange-50/80 px-4 py-1 rounded-2xl w-fit self-center md:self-start shadow-sm">{t('hero.headlineHighlight')}</span>
                            <span className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">{t('hero.headline2')}</span>
                        </h1>
                        <div className="text-gray-600 text-lg md:text-xl mb-12 max-w-lg leading-relaxed font-medium whitespace-pre-line">
                            {t('hero.subhead')}
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 w-full">
                            <a href="#analysis-section" className="btn-orange text-white px-10 py-3.5 md:px-12 md:py-5 rounded-full font-black shadow-xl text-base md:text-lg tracking-wide w-fit mx-auto md:mx-0 text-center transition-all">
                                {t('hero.cta')}
                            </a>
                        </div>
                    </div>

                    <div className="hidden md:flex relative justify-center items-center h-full order-2">
                        <div className="relative">
                            <img src="https://iili.io/qfrfmxf.jpg" alt={t('hero.imageAlt')} className="rounded-[50px] shadow-2xl object-cover w-full max-w-md md:max-w-xl h-[400px] md:h-[600px] border-8 border-white" />
                            <div className="absolute bottom-10 -left-6 md:-left-16 bg-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4 z-20 border border-orange-50 animate-float pointer-events-none">
                                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-inner">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </div>
                                <div className="whitespace-nowrap">
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{t('hero.badgeKicker')}</div>
                                    <div className="text-xl font-black text-gray-800 tracking-tight">{t('hero.badgeTitle')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <svg className="wave-divider" viewBox="0 0 1440 100" preserveAspectRatio="none">
                    <path d="M0,64L48,64C96,64,192,64,288,58.7C384,53,480,43,576,42.7C672,43,768,53,864,64C960,75,1056,85,1152,85.3C1248,85,1344,75,1392,69.3L1440,64L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z" />
                </svg>
            </section>

            {/* Pain */}
            <section id="analysis-section" className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                                {t('pain.title')}<br className="hidden md:block" />{t('pain.titleBreak')}
                            </h2>
                            <div className="w-24 h-1.5 bg-orange-400 mx-auto mt-6 rounded-full shadow-sm" />
                        </div>
                        <div className="space-y-8 text-lg md:text-xl text-slate-600 leading-relaxed text-left">
                            <p className="font-black text-slate-800 text-2xl md:text-3xl mb-10 text-center">{t('pain.lead')}</p>
                            <p>{t('pain.p1')}<span className="text-orange-600 font-black">{t('pain.p1Highlight')}</span>{t('pain.p1End')}</p>
                            <p>{t('pain.p2Pre')}<span className="border-b-4 border-orange-100 font-bold">{t('pain.p2Inline')}</span>{t('pain.p2End')}</p>
                            <div className="bg-orange-50 p-8 rounded-[40px] border-l-8 border-orange-400 my-10">
                                <p className="font-black text-slate-900 mb-4">{t('pain.boxTitle')}</p>
                                <p>{t('pain.boxBody')}</p>
                            </div>
                            <p>{t('pain.p3Pre')}<span className="text-slate-900 font-black underline decoration-orange-200 decoration-4">{t('pain.p3Em1')}</span>{t('pain.p3Mid')}<span className="text-slate-900 font-black underline decoration-orange-200 decoration-4">{t('pain.p3Em2')}</span>{t('pain.p3End')}</p>
                            <p className="font-black text-slate-800 pt-6">{t('pain.p4')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Expectations + Pricing */}
            <section id="session-section" className="py-24 bg-orange-50/50 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900">{t('expectations.title')}</h2>
                            <p className="text-gray-500 mt-4 text-lg">{t('expectations.subtitle')}</p>
                            <div className="w-24 h-1.5 bg-orange-400 mx-auto mt-6 rounded-full shadow-sm" />
                        </div>

                        <div className="bg-white p-8 md:p-12 rounded-[60px] shadow-xl border border-orange-100 relative">
                            <div className="absolute -top-5 right-10 bg-slate-900 text-white px-8 py-2 rounded-full font-black shadow-lg">
                                {t('expectations.ribbon')}
                            </div>

                            <div className="space-y-10">
                                {expectations.map((item, i) => (
                                    <div key={i} className="flex gap-5 items-start">
                                        <span className="text-orange-500 text-2xl flex-shrink-0 mt-1 font-bold">✔</span>
                                        <div>
                                            <h4 className="text-xl md:text-2xl font-black text-slate-800 mb-2">{item.title}</h4>
                                            <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div id="pricing-section" className="mt-16 pt-10 border-t border-orange-100 text-center">
                                <p className="text-xl md:text-2xl font-black text-slate-800 mb-12 leading-relaxed">
                                    {t('expectations.summaryPre')}<br />
                                    {t('expectations.summaryMid')}<span className="text-orange-600">{t('expectations.summaryEm')}</span>{t('expectations.summaryEnd')}
                                </p>

                                <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
                                    {/* Plan 1 */}
                                    <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-200 flex flex-col hover:border-orange-200 transition-all">
                                        <div className="mb-6">
                                            <h5 className="text-2xl font-black text-slate-900 mb-2">{pricingPlans[0].emoji} {pricingPlans[0].name}</h5>
                                            <div className="text-2xl font-black text-orange-500">👉 {pricingPlans[0].labelInline} {formatCurrency(pricingPlans[0].price, locale)}</div>
                                        </div>
                                        <ul className="space-y-3 text-slate-600 font-bold flex-grow">
                                            {pricingPlans[0].features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2"><span className="text-orange-500">✔</span> {f}</li>
                                            ))}
                                        </ul>
                                        <Link href={`/booking?service=${pricingPlans[0].id}`} className="mt-8 bg-slate-800 text-white py-4 rounded-full font-black text-center hover:bg-slate-900 transition-all block">
                                            {t('hero.cta')}
                                        </Link>
                                    </div>

                                    {/* Plan 2 */}
                                    <div className="bg-orange-50 p-8 rounded-[40px] border-4 border-orange-400 flex flex-col relative scale-100 md:scale-105 shadow-2xl z-10">
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-1 rounded-full font-black text-base uppercase tracking-widest shadow-lg text-center">
                                            {pricingPlans[1].discount}
                                        </div>
                                        <div className="mb-6">
                                            <h5 className="text-2xl font-black text-slate-900 mb-1">{pricingPlans[1].emoji} {pricingPlans[1].name}</h5>
                                            <p className="text-orange-600 font-bold text-sm mb-2">{pricingPlans[1].subtitle}</p>
                                            <div className="flex items-end gap-3 justify-start flex-wrap">
                                                <div className="text-3xl font-black text-orange-600">{formatCurrency(pricingPlans[1].price, locale)}</div>
                                                <div className="text-lg text-gray-400 line-through mb-1">{formatCurrency(pricingPlans[1].originalPrice, locale)}</div>
                                            </div>
                                        </div>
                                        <p className="text-orange-700 font-black text-sm mb-4 bg-orange-100/50 p-3 rounded-xl italic">「{pricingPlans[1].quote}」</p>
                                        <ul className="space-y-3 text-slate-700 font-bold flex-grow">
                                            {pricingPlans[1].features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2"><span className="text-orange-600">✔</span> {f}</li>
                                            ))}
                                            <li className="flex items-center gap-2 text-orange-600 font-black pt-2 border-t border-orange-200 mt-2">
                                                <span>{pricingPlans[1].bonusEmoji}</span> {pricingPlans[1].bonus}
                                            </li>
                                        </ul>
                                        <Link href={`/booking?service=${pricingPlans[1].id}`} className="mt-8 btn-orange text-white py-4 rounded-full font-black text-center shadow-lg block">
                                            {t('hero.cta')}
                                        </Link>
                                    </div>
                                </div>

                                {/* Guarantee */}
                                <div className="mt-20 p-8 md:p-12 rounded-[50px] bg-slate-50 border-2 border-slate-200 relative text-left">
                                    <div className="absolute -top-5 left-8 bg-white border-2 border-slate-200 px-6 py-1 rounded-full font-black text-slate-700 text-sm">{t('guarantee.label')}</div>
                                    <div className="space-y-6">
                                        <p className="text-xl md:text-2xl font-black text-slate-800 leading-relaxed">{t('guarantee.title')}<br className="hidden md:block" />{t('guarantee.titleBreak')}</p>
                                        <p className="text-slate-600 text-lg leading-relaxed">{t('guarantee.body')}<br className="hidden md:block" />{t('guarantee.bodyBreak')}</p>
                                        <div className="grid md:grid-cols-3 gap-6 pt-4">
                                            {guaranteeItems.map((it, i) => (
                                                <div key={i} className="flex items-center gap-3 text-slate-800 font-black">
                                                    <span className="text-orange-500 text-xl">✔</span> {it}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Flow */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-16">{t('flow.title')}</h2>
                    <div className="grid md:grid-cols-3 gap-12 relative max-w-6xl mx-auto">
                        {flowSteps.map((item) => (
                            <div key={item.step} className="flex flex-col items-center text-center group relative">
                                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm z-10">
                                    {item.step}
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-4">{item.title}</h4>
                                <p className="text-slate-600 leading-relaxed px-4 text-sm md:text-base font-bold whitespace-pre-line">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <FAQSection />

            {/* Testimonials */}
            <section className="py-24 bg-gray-50/50 overflow-hidden relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900">{t('testimonials.title')}</h2>
                        <div className="w-20 h-1.5 bg-orange-200 mx-auto mt-6 rounded-full" />
                    </div>
                    <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 md:gap-8 md:grid md:grid-cols-3 md:overflow-visible items-stretch pb-10 px-2 lg:px-4">
                        {testimonials.map((tc, i) => (
                            <div key={i} className="review-card flex-shrink-0 w-[85vw] snap-center bg-white p-6 md:p-8 rounded-[48px] border border-gray-100 flex flex-col h-auto md:w-full">
                                <div className="min-h-[auto] md:min-h-[520px] flex flex-col text-gray-700">
                                    <div className="flex text-brand-orange text-xl mb-4">{'★'.repeat(tc.rating)}</div>
                                    <p className="font-bold text-gray-800 text-xl mb-3">{tc.title}</p>
                                    <InnerHtml as="p" className="text-gray-600 italic leading-relaxed text-sm lg:text-base mb-6" html={tc.text} />
                                </div>
                                <div className="aspect-[3/4] rounded-[36px] overflow-hidden shadow-inner mb-6 flex-shrink-0">
                                    <img src={tc.image} alt={tc.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="mt-auto border-t border-gray-200 pt-6">
                                    <div className="font-black text-lg text-gray-900">{tc.name} ❤️</div>
                                    <div className="text-xs text-brand-orange font-bold uppercase mt-1 tracking-wider">{tc.tag}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Philosophy */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h3 className="text-brand-orange font-black tracking-widest mb-3 uppercase text-sm">{t('philosophy.kicker')}</h3>
                    <h2 className="text-3xl md:text-5xl font-black mb-16 text-gray-900">{t('philosophy.title')}</h2>
                    <div className="grid md:grid-cols-3 gap-10">
                        {philosophyItems.map((item, i) => (
                            <div key={i} className="p-10 rounded-[50px] bg-gray-50 hover:shadow-xl transition-all border border-orange-50 group text-center review-card">
                                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                                <h4 className="text-2xl font-black mb-4 text-gray-900">{item.title}</h4>
                                <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About */}
            <section id="about-section" className="py-24 bg-gray-50 relative">
                <div className="absolute top-10 left-10 text-9xl font-black hidden lg:block uppercase text-gray-100 tracking-widest select-none pointer-events-none">
                    {t('about.background')}
                </div>
                <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-5 relative">
                        <div className="relative">
                            <img src="https://i.postimg.cc/cCmVvZ17/Gemini-Generated-Image-elzircelzircelzi-(1).jpg" alt={t('about.coachAlt')} className="w-full h-auto rounded-[60px] shadow-2xl relative z-10 border-8 border-white" />
                            <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-100 rounded-full -z-10 animate-float opacity-50 pointer-events-none" />
                        </div>
                        <div className="mt-12 hidden md:flex flex-wrap justify-start gap-10">
                            <img src="https://i.postimg.cc/zGJwTcTg/CATCH-CCDT-Seal-Blue-300.png" className="h-20 transition-transform hover:scale-105" alt="CATCH CCDT" />
                            <img src="https://i.postimg.cc/P52WyQM8/kpa-badge-ctp-2012-10-01-300x194.png" className="h-20 transition-transform hover:scale-105" alt="KPA CTP" />
                        </div>
                    </div>

                    <div className="md:col-span-7 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-12 leading-snug text-gray-900 text-left">
                            <span className="inline-block border-b-8 border-orange-100 rounded-lg">{t('about.titleEm')}</span><br />
                            {t('about.titleBreak')}
                        </h2>
                        <div className="space-y-6 text-gray-700 text-lg leading-relaxed max-w-2xl text-left">
                            <p>{t('about.p1Pre')}<span className="font-bold text-gray-900">{t('about.p1Em')}</span>{t('about.p1End')}</p>
                            <p>{t('about.p2')}</p>
                            <p className="font-bold text-brand-orange italic underline decoration-orange-200 decoration-4 -underline-offset-2">{t('about.p3')}</p>
                            <div className="bg-orange-50/50 p-8 rounded-[48px] border-2 border-orange-100 shadow-sm mt-10">
                                <p className="font-black mb-6 text-gray-900 text-xl flex items-center gap-2">
                                    <span className="text-brand-orange">🐾</span> {t('about.boxTitle')}
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-8 text-base font-bold text-gray-800">
                                    {aboutBoxItems.map((it, i) => (
                                        <li key={i} className="flex items-center gap-3"><span className="text-brand-orange">●</span> {it}</li>
                                    ))}
                                </ul>
                            </div>
                            <p className="mt-10 font-medium">{t('about.outro')}</p>
                        </div>
                        <div className="mt-14 flex flex-col items-center md:items-start">
                            <div className="signature text-4xl md:text-5xl text-gray-800">Eric & Pennee</div>
                            <div className="text-sm text-gray-400 mt-3 uppercase tracking-[0.2em] font-black">{t('about.credentials')}</div>
                            <div className="mt-10 flex md:hidden gap-8">
                                <img src="https://i.postimg.cc/zGJwTcTg/CATCH-CCDT-Seal-Blue-300.png" className="h-16" alt="CATCH CCDT" />
                                <img src="https://i.postimg.cc/P52WyQM8/kpa-badge-ctp-2012-10-01-300x194.png" className="h-16" alt="KPA CTP" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-primary relative overflow-hidden text-white text-center px-6">
                <div className="absolute -bottom-20 -right-20 opacity-10 rotate-12 animate-float pointer-events-none">
                    <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
                <div className="container mx-auto relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black mb-10 leading-tight text-white">{t('cta.title')}<br />{t('cta.titleBreak')}</h2>
                    <p className="text-xl md:text-2xl mb-14 opacity-90 max-w-2xl mx-auto text-center font-medium">{t('cta.body')}</p>
                    <Link href="/#pricing-section" className="inline-block bg-white text-brand-orange px-16 py-6 rounded-full font-black text-2xl shadow-2xl hover:bg-orange-50 hover:-translate-y-2 transition-all text-center">
                        {t('cta.button')}
                    </Link>
                </div>
            </section>

            {/* Latest Posts */}
            {latestPosts.length > 0 && (
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900">{t('latestPosts.title')}</h2>
                            <Link href="/blog" className="px-6 py-2 rounded-full font-bold border-2 border-orange-200 text-gray-600 hover:bg-orange-50 hover:text-brand-orange transition-colors">{t('latestPosts.viewAll')}</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {latestPosts.map((post) => (
                                <div key={post.id} className="review-card">
                                    <BlogCard post={post} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <NewsletterCTA variant="full" />
        </>
    );
}
