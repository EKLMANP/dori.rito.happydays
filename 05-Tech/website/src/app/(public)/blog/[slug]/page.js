import { getPostBySlug, getAllPostSlugs, getRelatedPosts } from '@/lib/ghost';
import { extractHeadings, injectHeadingIds } from '@/lib/toc';
import { articleSchema } from '@/lib/schema';
import { BRAND } from '@/lib/constants';
import NewsletterCTA from '@/components/NewsletterCTA';
import BlogCard from '@/components/BlogCard';
import GhostVideoPlayer from '@/components/GhostVideoPlayer';
import TableOfContents from '@/components/TableOfContents';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 300;

export async function generateStaticParams() {
    const slugs = await getAllPostSlugs();
    return slugs;
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const post = await getPostBySlug(resolvedParams.slug);
    if (!post) return { title: '文章不存在' };
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
        alternates: { canonical: `/blog/${post.slug}` },
    };
}

export default async function BlogPostPage({ params }) {
    const resolvedParams = await params;
    const post = await getPostBySlug(resolvedParams.slug);
    if (!post) notFound();

    const relatedPosts = await getRelatedPosts(post.slug, post.primary_tag?.slug, 3);

    const formattedDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString('zh-TW', {
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
                {/* Breadcrumb */}
                <nav style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    <Link href="/">首頁</Link>
                    {' / '}
                    <Link href="/blog">毛孩知識</Link>
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
                    {post.reading_time && <span>⏱️ 約 {post.reading_time} 分鐘閱讀</span>}
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

                {/* Table of Contents */}
                <TableOfContents headings={headings} />

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
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', marginRight: '0.75rem' }}>相關主題：</span>
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
            {relatedPosts.length > 0 && (
                <section className="section" style={{ backgroundColor: 'var(--color-cream)' }}>
                    <div className="container">
                        <h2 style={{ marginBottom: '2rem' }}>你可能也感興趣</h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1.5rem',
                        }}>
                            {relatedPosts.map((p) => <BlogCard key={p.id} post={p} />)}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
