'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * 電子報訂閱 CTA 元件
 * variant: 'inline' (文章中間嵌入) | 'full' (文末/首頁大區塊)
 */
export default function NewsletterCTA({ variant = 'full' }) {
    const t = useTranslations('common.newsletter');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const isInline = variant === 'inline';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        setStatus('loading');

        try {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_subscribe', {
                    event_category: 'engagement',
                    event_label: variant,
                });
            }

            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    if (isInline) {
        return (
            <div
                id="newsletter"
                style={{
                    background: '#FAF4E4',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    margin: '2.5rem 0',
                    textAlign: 'center',
                }}
            >
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('button')}
                </p>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>{t('headline')}</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                    {t('subhead')}
                </p>
                <SubscribeForm t={t} email={email} setEmail={setEmail} status={status} handleSubmit={handleSubmit} />
            </div>
        );
    }

    return (
        <section
            id="newsletter"
            className="hero-bg bg-paw-texture py-24 px-6 text-center"
        >
            <div className="container" style={{ maxWidth: '600px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📩</div>
                <h2 style={{ marginBottom: '0.75rem' }}>{t('headline')}</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                    {t('subhead')}
                </p>
                <SubscribeForm t={t} email={email} setEmail={setEmail} status={status} handleSubmit={handleSubmit} large />
            </div>
        </section>
    );
}

function SubscribeForm({ t, email, setEmail, status, handleSubmit, large }) {
    if (status === 'success') {
        return (
            <div style={{
                padding: '1rem 1.5rem',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: '1rem',
            }}>
                ✅ {t('successMessage')}
            </div>
        );
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}
            >
                <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('placeholder')}
                    required
                    style={{ flex: '1', minWidth: '220px', maxWidth: large ? '380px' : '280px' }}
                    aria-label={t('placeholder')}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={status === 'loading'}
                    id="newsletter-subscribe-btn"
                    style={{ padding: large ? '0.875rem 2rem' : '0.75rem 1.5rem' }}
                >
                    {status === 'loading' ? t('submitting') : t('button')}
                </button>
            </form>
            {status === 'error' && (
                <p style={{ marginTop: '0.75rem', color: '#c0392b', fontSize: '0.875rem' }}>
                    ❌ {t('errorMessage')}
                </p>
            )}
        </>
    );
}
