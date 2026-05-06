import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPosts, getTags } from '@/lib/ghost';
import { buildAlternates } from '@/lib/metadata';
import BlogCard from '@/components/BlogCard';
import NewsletterCTA from '@/components/NewsletterCTA';
import TagFilterDropdown from '@/components/TagFilterDropdown';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.blog' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates({ locale, path: '/blog' }),
    };
}

export const revalidate = 300;

export default async function BlogListPage({ params, searchParams }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('blog');
    const resolvedSearchParams = await searchParams;
    const tagFilter = resolvedSearchParams?.tag || '';

    const [{ posts, meta }, tags] = await Promise.all([
        getPosts({ limit: 12, tag: tagFilter }),
        getTags(),
    ]);

    const seen = new Set();
    const tagOptions = tags
        .filter(tag => !tag.slug.startsWith('hash-') && tag.count?.posts > 0)
        .filter(tag => {
            const key = tag.name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map(tag => ({ label: tag.name, value: tag.slug }));

    const minReadTemplate = t('card.minRead', { n: '{{N}}' });
    const minReadSuffix = minReadTemplate.replace('{{N}}', '').trim();

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
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        {t('hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* Tag Filter Bar */}
            <section style={{ background: 'var(--color-white)', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: '72px', zIndex: 10 }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>{t('filter.label')}</span>
                        <TagFilterDropdown
                            tags={tagOptions}
                            currentTag={tagFilter}
                            allPostsLabel={t('filter.allPosts')}
                        />
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
                                {posts.map((post) => (
                                    <BlogCard
                                        key={post.id}
                                        post={post}
                                        locale={locale}
                                        readMoreLabel={t('card.readMore')}
                                        minReadSuffix={minReadSuffix}
                                    />
                                ))}
                            </div>
                            {meta?.pagination && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    {t('pagination.showing', { count: posts.length, total: meta.pagination.total })}
                                </p>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                            <h3 style={{ marginBottom: '0.75rem' }}>{t('empty.title')}</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
                                {t('empty.body')}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <NewsletterCTA variant="full" />
        </>
    );
}
