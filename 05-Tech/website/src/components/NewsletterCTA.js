'use client';

import { useState } from 'react';
import { NEWSLETTER_COPY } from '@/lib/constants';

/**
 * 電子報訂閱 CTA 元件
 * variant: 'inline' (文章中間嵌入) | 'full' (文末/首頁大區塊)
 */
export default function NewsletterCTA({ variant = 'full' }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const isInline = variant === 'inline';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        setStatus('loading');

        try {
            // Track newsletter subscription event in GA4
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
                    訂閱電子報
                </p>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                    {NEWSLETTER_COPY.headline}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                    {NEWSLETTER_COPY.subhead}
                </p>
                <SubscribeForm email={email} setEmail={setEmail} status={status} handleSubmit={handleSubmit} />
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
                <h2 style={{ marginBottom: '0.75rem' }}>{NEWSLETTER_COPY.headline}</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                    {NEWSLETTER_COPY.subhead}
                </p>
                <SubscribeForm email={email} setEmail={setEmail} status={status} handleSubmit={handleSubmit} large />
            </div>
        </section>
    );
}

function SubscribeForm({ email, setEmail, status, handleSubmit, large }) {
    const { placeholder, button, successMessage, errorMessage } = NEWSLETTER_COPY;

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
                ✅ {successMessage}
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
                    placeholder={placeholder}
                    required
                    style={{ flex: '1', minWidth: '220px', maxWidth: large ? '380px' : '280px' }}
                    aria-label="電子郵件地址"
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={status === 'loading'}
                    id="newsletter-subscribe-btn"
                    style={{ padding: large ? '0.875rem 2rem' : '0.75rem 1.5rem' }}
                >
                    {status === 'loading' ? '訂閱中...' : button}
                </button>
            </form>
            {status === 'error' && (
                <p style={{ marginTop: '0.75rem', color: '#c0392b', fontSize: '0.875rem' }}>
                    ❌ {errorMessage}
                </p>
            )}
        </>
    );
}
