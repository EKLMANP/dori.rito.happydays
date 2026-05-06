import { setRequestLocale, getTranslations } from 'next-intl/server';
import { organizationSchema } from '@/lib/schema';
import { BRAND } from '@/lib/constants';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/metadata';
import NewsletterCTA from '@/components/NewsletterCTA';
import { JsonLd } from '@/components/InnerHtml';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.about' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates({ locale, path: '/about' }),
    };
}

export default async function AboutPage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('about');

    const trainers = t.raw('trainerProfiles');
    const stats = t.raw('stats');
    const tags = t.raw('mission.tags');

    return (
        <>
            <JsonLd data={organizationSchema()} />

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(160deg, var(--color-cream) 0%, var(--color-sage) 100%)',
                padding: '5rem 1.5rem 4rem',
                textAlign: 'center',
            }}>
                <div className="container" style={{ maxWidth: '640px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐾</div>
                    <h1 style={{ marginBottom: '1rem' }}>{t('hero.title')}</h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                        {t('hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="section bg-white">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ marginBottom: '1rem' }}>{t('mission.title')}</h2>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1rem' }}>
                                {t('mission.p1')}
                            </p>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                                {t('mission.p2')}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {tags.map((tag) => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-primary-light) 100%)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '3rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                        }}>
                            {stats.map((stat) => (
                                <div key={stat.label}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{stat.number}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Trainer Profiles */}
            <section className="section" style={{ background: 'var(--color-cream)' }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>{t('trainers.title')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {trainers.map((trainer) => (
                            <div key={trainer.name} className="card">
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-sage))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2.5rem', marginBottom: '1.25rem',
                                }}>
                                    {trainer.emoji}
                                </div>
                                <h3 style={{ marginBottom: '0.25rem' }}>{trainer.name}</h3>
                                <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    {trainer.title}
                                </p>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1rem', fontSize: '0.95rem' }}>
                                    {trainer.bio}
                                </p>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('trainers.certLabel')}</p>
                                    {trainer.certifications.map((cert) => (
                                        <p key={cert} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>• {cert}</p>
                                    ))}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{t('trainers.specialtyLabel')}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{trainer.specialty}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-sage" style={{ textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '500px' }}>
                    <h2 style={{ marginBottom: '1rem' }}>{t('cta.title')}</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
                        {t('cta.subtitle')}
                    </p>
                    <Link href="/booking" className="btn btn-primary btn-lg" id="about-cta">
                        {t('cta.button')}
                    </Link>
                </div>
            </section>

            <NewsletterCTA variant="full" />
        </>
    );
}
