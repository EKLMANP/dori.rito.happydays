'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { getFAQS } from '@/lib/constants';

export default function FAQSection({ faqs, title }) {
    const locale = useLocale();
    const [openIndex, setOpenIndex] = useState(null);

    const items = faqs ?? getFAQS(locale);
    const heading = title ?? (locale === 'en' ? 'Frequently asked questions' : '常見問題');

    return (
        <section className="section bg-white">
            <div className="container" style={{ maxWidth: '800px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2.5rem' }}>{heading}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map((faq, i) => (
                        <div
                            key={i}
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                background: openIndex === i ? '#f9fafb' : 'var(--color-white)',
                                transition: 'var(--transition)',
                            }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                style={{
                                    width: '100%',
                                    padding: '1.25rem 1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: 'var(--color-text)',
                                    gap: '1rem',
                                }}
                                aria-expanded={openIndex === i}
                            >
                                <span>{faq.question}</span>
                                <span style={{
                                    fontSize: '1.2rem',
                                    transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.25s ease',
                                    flexShrink: 0,
                                    color: 'var(--color-primary)',
                                }}>+</span>
                            </button>
                            {openIndex === i && (
                                <div style={{
                                    padding: '0 1.5rem 1.25rem',
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.7,
                                    animation: 'fadeInUp 0.2s ease',
                                }}>
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
