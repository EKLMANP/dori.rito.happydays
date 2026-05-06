import { Link } from '@/i18n/navigation';
import Image from 'next/image';

export default function BlogCard({ post, locale = 'zh-TW', readMoreLabel = '閱讀更多 →', minReadSuffix = '分鐘' }) {
    const { title, slug, excerpt, feature_image, published_at, reading_time, tags } = post;

    const formattedDate = published_at
        ? new Date(published_at).toLocaleDateString(locale, {
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
                    {/* Tags */}
                    {tags && tags.filter(t => t.visibility === 'public' && !t.name.startsWith('#')).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignSelf: 'flex-start' }}>
                            {tags
                                .filter(t => t.visibility === 'public' && !t.name.startsWith('#'))
                                .map(t => (
                                    <span key={t.id} className="tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                                        {t.name}
                                    </span>
                                ))
                            }
                        </div>
                    )}
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
                        paddingTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        borderTop: '1px solid var(--color-border)',
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                    }}>
                        {formattedDate && <span style={{ flexShrink: 0 }}>📅 {formattedDate}</span>}
                        {reading_time && <span style={{ flexShrink: 0 }}>⏱️ {reading_time} {minReadSuffix}</span>}
                        <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600, flexShrink: 0 }}>{readMoreLabel}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
