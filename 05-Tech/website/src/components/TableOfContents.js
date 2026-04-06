'use client';

import { useState } from 'react';

export default function TableOfContents({ headings }) {
    const [isOpen, setIsOpen] = useState(false);

    // Only show H2 headings in TOC
    const h2Headings = headings ? headings.filter((h) => h.level === 2) : [];
    if (h2Headings.length < 2) return null;

    return (
        <nav className="toc" aria-label="文章目錄">
            <button
                className="toc-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className="toc-title">本文目錄</span>
                <svg
                    className={`toc-chevron ${isOpen ? 'toc-chevron--open' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                >
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <ol className={`toc-list ${isOpen ? 'toc-list--open' : ''}`}>
                {h2Headings.map((h) => (
                    <li key={h.id} className="toc-item">
                        <a
                            href={`#${h.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(h.id);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                    history.replaceState(null, '', `#${h.id}`);
                                }
                            }}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
