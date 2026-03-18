'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ThankYouContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');

    const content = {
        success: {
            icon: '🎉',
            title: '訂閱確認成功！',
            message: '太好了，你已經成功加入 Dori & Rito Happydays 電子報！我們每週會和你分享實用的毛孩行為調整方法，一起打造你與毛孩的理想生活。',
            subMessage: '一封歡迎信已經寄到你的信箱了 📬',
        },
        expired: {
            icon: '⏰',
            title: '連結已過期',
            message: '這個確認連結已經過期了。請回到官網重新訂閱，我們會寄一封新的確認信給你。',
            subMessage: null,
        },
        invalid: {
            icon: '❌',
            title: '無效的連結',
            message: '這個確認連結無效，可能是網址不完整。請回到官網重新訂閱。',
            subMessage: null,
        },
        error: {
            icon: '⚠️',
            title: '發生了一點問題',
            message: '確認過程中發生錯誤，請稍後再試。如果問題持續，請聯繫我們。',
            subMessage: null,
        },
    };

    const c = content[status] || content.success;

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
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{c.icon}</div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                    {c.title}
                </h1>
                <p
                    style={{
                        fontSize: '1.05rem',
                        lineHeight: '1.8',
                        color: 'var(--color-text-muted)',
                        marginBottom: c.subMessage ? '1rem' : '2rem',
                    }}
                >
                    {c.message}
                </p>
                {c.subMessage && (
                    <p
                        style={{
                            fontSize: '0.95rem',
                            color: 'var(--color-accent)',
                            fontWeight: 600,
                            marginBottom: '2rem',
                        }}
                    >
                        {c.subMessage}
                    </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                        href="/"
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        回到首頁
                    </a>
                    <a
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
                        瀏覽毛孩知識
                    </a>
                </div>
            </div>
        </section>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense
            fallback={
                <section
                    style={{
                        minHeight: 'calc(100vh - 72px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <p>載入中...</p>
                </section>
            }
        >
            <ThankYouContent />
        </Suspense>
    );
}

