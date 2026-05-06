'use client';

import { useRouter } from '@/i18n/navigation';

export default function TagFilterDropdown({ tags, currentTag, allPostsLabel = '所有文章' }) {
    const router = useRouter();

    const handleChange = (e) => {
        const value = e.target.value;
        router.push(value ? `/blog?tag=${value}` : '/blog');
    };

    return (
        <select
            value={currentTag}
            onChange={handleChange}
            style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--color-text)',
                background: 'var(--color-white)',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234A4A38' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                minWidth: '160px',
            }}
        >
            <option value="">{allPostsLabel}</option>
            {tags.map((tag) => (
                <option key={tag.value} value={tag.value}>
                    {tag.label}
                </option>
            ))}
        </select>
    );
}
