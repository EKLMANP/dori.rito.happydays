'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NAV_LINKS, TALLY } from '@/lib/constants';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 關閉 mobile menu 當 route 改變
    useEffect(() => { setMobileOpen(false); }, []);

    return (
        <>
            <nav className={`flex items-center justify-between px-6 md:px-8 py-4 sticky top-0 z-50 transition-all ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/90 backdrop-blur-md shadow-sm'}`}>
                <div className="flex items-center">
                    <Link href="/">
                        <img src="https://iili.io/qf6QsVe.png" alt="Eric & Pennee Logo" className="h-10 md:h-14 object-contain" />
                    </Link>
                </div>
                <div className="hidden md:flex gap-8 font-bold items-center text-gray-600">
                    {NAV_LINKS.map(link => (
                        <Link key={link.href} href={link.href} className="hover:text-brand-orange transition-colors">
                            {link.label}
                        </Link>
                    ))}
                    <a href={TALLY.consultUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex items-center justify-center shadow-md scale-90 origin-right transition-all">
                        預約諮詢
                    </a>
                </div>
                <div className="md:hidden flex items-center gap-4">
                    <a href={TALLY.consultUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex items-center justify-center shadow-md scale-75 origin-right transition-all">
                        預約諮詢
                    </a>
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-[#F75000]">
                        {mobileOpen ? '✕' : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Drawer */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-[49] bg-black/50"
                    onClick={() => setMobileOpen(false)}
                >
                    <div
                        className="absolute top-[72px] md:top-[88px] right-0 w-full bg-white px-6 py-8 flex flex-col gap-6 shadow-xl border-t border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {NAV_LINKS.map(link => (
                            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-xl font-bold text-gray-800 hover:text-brand-orange block text-center">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
