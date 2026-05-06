'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Suspense } from 'react';

function ThankYouContent() {
    const searchParams = useSearchParams();
    const t = useTranslations('common.thankyou');
    const status = searchParams.get('status') || 'success';

    const validStatuses = ['success', 'expired', 'invalid', 'error'];
    const key = validStatuses.includes(status) ? status : 'success';

    const icon = t(`${key}.icon`);
    const title = t(`${key}.title`);
    const message = t(`${key}.message`);
    const subMessage = t(`${key}.subMessage`);

    return (
        <section
            style={{
                minHeight: 'calc(100vh - 72px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--section-padding)',
                background: 'linear-gradient(180deg, var(--color-cream) 0%, var(--color-sage) 100%)',
            }}
        >
            <div
                style={{
                    maxWidth: '520px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2.5rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
            >
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{icon}</div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                    {title}
                </h1>
                <p style={{
                    fontSize: '1.05rem',
                    lineHeight: '1.8',
                    color: 'var(--color-text-muted)',
                    marginBottom: subMessage ? '1rem' : '2rem',
                }}>
                    {message}
                </p>
                {subMessage && (
                    <p style={{
                        fontSize: '0.95rem',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                        marginBottom: '2rem',
                    }}>
                        {subMessage}
                    </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                        {t('backHome')}
                    </Link>
                    <Link
                        href="/blog"
                        className="btn"
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid var(--color-accent)',
                            color: 'var(--color-accent)',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                        }}
                    >
                        {t('browseBlog')}
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function ThankYouPage() {
    const t = useTranslations('common.thankyou');
    return (
        <Suspense
            fallback={
                <section style={{
                    minHeight: 'calc(100vh - 72px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <p>{t('loading')}</p>
                </section>
            }
        >
            <ThankYouContent />
        </Suspense>
    );
}
