import { getPosts, getTags } from '@/lib/ghost';
import { BRAND } from '@/lib/constants';
import BlogCard from '@/components/BlogCard';
import NewsletterCTA from '@/components/NewsletterCTA';
import Link from 'next/link';

export const metadata = {
    title: '毛孩知識',
    description: '專業 KPA 認證訓犬師撰寫的狗狗行為訓練知識庫。幼犬訓練、分離焦慮、反應性犬、基礎服從，讓你用正向的方法理解並引導毛孩。',
    alternates: { canonical: '/blog' },
};

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function BlogListPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const tagFilter = resolvedSearchParams?.tag || '';

    const [{ posts, meta }, tags] = await Promise.all([
        getPosts({ limit: 12, tag: tagFilter }),
        getTags(),
    ]);

    const tagDisplayMap = {
        'puppy-training': '幼犬訓練',
        'separation-anxiety': '分離焦慮',
        'reactive-dog': '反應性犬',
        'basic-obedience': '基礎服從',
        'behavior-issues': '行為問題',
    };

    return (
        <>
            {/* Hero */}
            <section className="hero-bg bg-paw-texture py-16 px-6 text-center relative overflow-hidden">
                {/* 裝飾用背景腳印 (桌面版) */}
                <div className="absolute top-10 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
                <div className="container mx-auto max-w-2xl relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">狗狗行為文章</h1>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        由 KPA 認證訓犬師撰寫，幫助你用正向方法理解並引導毛孩
                    </p>
                </div>
            </section>

            {/* Tag Filter Bar */}
            <section style={{ background: 'var(--color-white)', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: '72px', zIndex: 10 }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', marginRight: '0.25rem', flexShrink: 0 }}>篩選：</span>
                        {[{ label: '全部文章', value: '' }, ...Object.entries(tagDisplayMap).map(([v, l]) => ({ label: l, value: v }))].map(
                            (tag) => (
                                <Link
                                    key={tag.value}
                                    href={tag.value ? `/blog?tag=${tag.value}` : '/blog'}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        background: tagFilter === tag.value ? 'var(--color-primary)' : 'var(--color-sand)',
                                        color: tagFilter === tag.value ? 'white' : 'var(--color-text)',
                                        transition: 'var(--transition)',
                                    }}
                                >
                                    {tag.label}
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="section bg-white">
                <div className="container">
                    {posts.length > 0 ? (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '1.5rem',
                                marginBottom: '3rem',
                            }}>
                                {posts.map((post) => <BlogCard key={post.id} post={post} />)}
                            </div>
                            {/* Pagination info */}
                            {meta?.pagination && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    顯示 {posts.length} 篇，共 {meta.pagination.total} 篇文章
                                </p>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                            <h3 style={{ marginBottom: '0.75rem' }}>文章即將上線！</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                我們正在撰寫專業的訓犬知識文章，敬請期待。<br />
                                先訂閱電子報，第一時間收到更新通知！
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <NewsletterCTA variant="full" />
        </>
    );
}
