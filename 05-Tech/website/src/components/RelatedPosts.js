'use client';

import { useState, useEffect } from 'react';
import BlogCard from './BlogCard';

export default function RelatedPosts({ posts }) {
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            setPerPage(window.innerWidth < 768 ? 1 : 3);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset page when perPage changes
    useEffect(() => {
        setPage(0);
    }, [perPage]);

    const totalPages = Math.ceil(posts.length / perPage);
    const visiblePosts = posts.slice(page * perPage, page * perPage + perPage);
    const showPagination = posts.length > perPage;

    return (
        <section className="section" style={{ backgroundColor: '#FAF4E4' }}>
            <div className="container">
                <h2 style={{ marginBottom: '2rem' }}>你可能也感興趣</h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(perPage, visiblePosts.length)}, 1fr)`,
                    gap: '1.5rem',
                }}>
                    {visiblePosts.map((p) => <BlogCard key={p.id} post={p} />)}
                </div>

                {showPagination && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '2rem',
                    }}>
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 0}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--color-border)',
                                background: page === 0 ? 'transparent' : '#fff',
                                color: page === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
                                cursor: page === 0 ? 'default' : 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                            }}
                        >
                            ← 上一頁
                        </button>

                        <span style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-text-muted)',
                        }}>
                            {page + 1} / {totalPages}
                        </span>

                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages - 1}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--color-border)',
                                background: page >= totalPages - 1 ? 'transparent' : '#fff',
                                color: page >= totalPages - 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                                cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                            }}
                        >
                            下一頁 →
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
