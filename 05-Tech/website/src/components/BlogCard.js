import Link from 'next/link';
import Image from 'next/image';

export default function BlogCard({ post }) {
    const { title, slug, excerpt, feature_image, published_at, reading_time, primary_tag } = post;

    const formattedDate = published_at
        ? new Date(published_at).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '';

    return (
        <Link
            href={`/blog/${slug}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <article className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Feature Image */}
                <div style={{ position: 'relative', height: '200px', background: 'var(--color-sage)', flexShrink: 0 }}>
                    {feature_image ? (
                        <Image
                            src={feature_image}
                            alt={title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                        }}>
                            🐾
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '0.25rem' }}>
                        {title}
                    </h3>
                    {excerpt && (
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-muted)',
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}>
                            {excerpt}
                        </p>
                    )}
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        borderTop: '1px solid var(--color-border)',
                    }}>
                        {primary_tag && (
                            <span style={{
                                padding: '0.15rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-sage)',
                                color: 'var(--color-text)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}>
                                {primary_tag.name}
                            </span>
                        )}
                        {formattedDate && <span>📅 {formattedDate}</span>}
                        {reading_time && <span>⏱️ {reading_time} 分鐘</span>}
                        <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>閱讀更多 →</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
