import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPostBySlug, getAllPostSlugs, getRelatedPosts, getPairedSlug } from '@/lib/ghost';
import { extractHeadings, injectHeadingIds } from '@/lib/toc';
import { articleSchema } from '@/lib/schema';
import { BRAND } from '@/lib/constants';
import { buildAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import NewsletterCTA from '@/components/NewsletterCTA';
import RelatedPosts from '@/components/RelatedPosts';
import GhostVideoPlayer from '@/components/GhostVideoPlayer';

import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';

export const revalidate = 300;

export async function generateStaticParams() {
    // Returns [{ locale, slug }] — only emit the correct locale per post
    const slugsWithLocale = await getAllPostSlugs();
    return slugsWithLocale;
}

export async function generateMetadata({ params }) {
    const { locale, slug } = await params;

    // Fetch without locale check so metadata always has content (redirect handled in page component)
    const raw = await getPostBySlug(slug);
    const post = raw?.post ?? raw; // support both { post } shape and direct post
    if (!post) return { title: locale === 'en' ? 'Post not found' : '文章不存在' };

    // Build slugsByLocale for correct per-locale hreflang alternates
    const otherLocale = locale === 'zh-TW' ? 'en' : 'zh-TW';
    const pairedSlug = await getPairedSlug(post, otherLocale);
    const slugsByLocale = { [locale]: post.slug };
    if (pairedSlug) slugsByLocale[otherLocale] = pairedSlug;

    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: post.feature_image ? [{ url: post.feature_image }] : [],
            type: 'article',
            publishedTime: post.published_at,
        },
        alternates: buildAlternates({ locale, slugsByLocale }),
    };
}

export default async function BlogPostPage({ params }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'blog' });

    // Locale-aware fetch:
    //   { post, isFallback: false } — correct locale ✓
    //   { post, isFallback: true }  — no translation exists; show fallback banner
    //   { shouldRedirect, targetSlug } — slug belongs to another locale; redirect
    //   null — post not found
    const result = await getPostBySlug(slug, locale);
    if (!result) notFound();

    if (result.shouldRedirect) {
        redirect(`/${locale}/blog/${result.targetSlug}`);
    }

    const { post, isFallback } = result;

    const relatedPosts = await getRelatedPosts(post.slug, post.tags, locale);

    const formattedDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString(locale, {
            year: 'numeric', month: 'long', day: 'numeric',
        })
        : '';

    // Extract headings and inject anchor IDs (must happen BEFORE split)
    const headings = extractHeadings(post.html || '');
    const htmlContent = injectHeadingIds(post.html || '', headings);
    const splitPoint = Math.floor(htmlContent.length * 0.55);
    const lastTagClose = htmlContent.lastIndexOf('</p>', splitPoint);
    const splitIndex = lastTagClose > 0 ? lastTagClose + 4 : splitPoint;
    const htmlPart1 = htmlContent.slice(0, splitIndex);
    const htmlPart2 = htmlContent.slice(splitIndex);

    return (
        <div style={{ backgroundColor: '#fff' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(post)) }}
            />

            <article style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
                {/* Fallback banner — shown when no translation exists for the requested locale */}
                {isFallback && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '0.875rem 1.25rem',
                        background: '#FFF8F0',
                        border: '1px solid #FDDCB5',
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        fontSize: '0.9rem',
                    }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🌐</span>
                        <div>
                            <strong>{t('fallbackBanner.title')}</strong>
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)' }}>
                                {t('fallbackBanner.body')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                <nav style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    <Link href="/">{t('post.home')}</Link>
                    {' / '}
                    <Link href="/blog">{t('post.blogSection')}</Link>
                    {post.primary_tag && (
                        <>
                            {' / '}
                            <Link href={`/blog?tag=${post.primary_tag.slug}`}>{post.primary_tag.name}</Link>
                        </>
                    )}
                </nav>

                {/* Title Area */}
                <h1 style={{ marginBottom: '1.25rem', lineHeight: 1.25 }}>{post.title}</h1>

                {/* Meta */}
                <div style={{
                    display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
                    fontSize: '0.875rem', color: 'var(--color-text-muted)',
                    marginBottom: '2rem', paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                }}>
                    <span>📅 {formattedDate}</span>
                    {post.reading_time && <span>⏱️ {t('post.readingTime', { n: post.reading_time })}</span>}
                    <span>✍️ {BRAND.nameShort}</span>
                </div>

                {/* Feature Image */}
                {post.feature_image && (
                    <div style={{ position: 'relative', height: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem' }}>
                        <Image
                            src={post.feature_image}
                            alt={post.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                            sizes="(max-width: 760px) 100vw, 760px"
                        />
                    </div>
                )}

                {/* Ghost video player activation */}
                <GhostVideoPlayer />

                {/* Article Content Part 1 (trusted Ghost CMS content) */}
                <div
                    className="ghost-content"
                    dangerouslySetInnerHTML={{ __html: htmlPart1 }}
                />

                {/* Mid-article Newsletter CTA */}
                <NewsletterCTA variant="inline" />

                {/* Article Content Part 2 */}
                <div
                    className="ghost-content"
                    dangerouslySetInnerHTML={{ __html: htmlPart2 }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', marginRight: '0.75rem' }}>{t('post.relatedTopics')}</span>
                        {post.tags
                            .filter((tag) => tag.visibility === 'public' && !tag.name.startsWith('#'))
                            .map((tag) => (
                            <Link key={tag.id} href={`/blog?tag=${tag.slug}`}
                                className="tag" style={{ marginRight: '0.5rem', textDecoration: 'none' }}>
                                {tag.name}
                            </Link>
                        ))}
                    </div>
                )}
            </article>

            {/* End-of-article Newsletter CTA */}
            <NewsletterCTA variant="full" />

            {/* Related Posts */}
            {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
        </div>
    );
}
