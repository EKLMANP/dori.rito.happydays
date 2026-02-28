import Link from 'next/link';
import { BRAND, TALLY } from '@/lib/constants';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="py-20 bg-slate-900 text-slate-400 mt-auto">
            <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12 text-center md:text-left">
                <div className="col-span-2">
                    <div className="flex items-center justify-center md:justify-start">
                        <img src="https://iili.io/qf6QsVe.png" alt="Eric & Pennee Logo" className="h-14 brightness-0 invert opacity-80 mb-8" />
                    </div>
                    <p className="max-w-xs mx-auto md:mx-0 font-medium leading-relaxed">我們致力於透過科學與愛心，幫助每一對人犬找到最舒適的生活節奏。透過理解，看見行為背後的真實需求。</p>
                </div>
                <div>
                    <h5 className="text-white font-black mb-8 text-lg tracking-widest">快速連結</h5>
                    <ul className="space-y-4 font-bold">
                        <li><Link href="/services" className="hover:text-brand-orange transition-colors">正向訓犬服務</Link></li>
                        <li><Link href="/blog" className="hover:text-brand-orange transition-colors">狗狗行為文章</Link></li>
                        <li><Link href="/contact" className="hover:text-brand-orange transition-colors">合作洽詢</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="text-white font-black mb-8 text-lg tracking-widest">Follow Us</h5>
                    <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-slate-800 hover:bg-brand-orange hover:text-white px-8 py-4 rounded-3xl transition-all group mx-auto md:mx-0">
                        <img src="/images/ig-logo.png" alt="Instagram" className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                    </a>
                    <div className="mt-10 space-y-2">
                        <p className="text-sm">✉️ {BRAND.email}</p>
                        <p className="text-sm">📍 北北基地區及線上諮詢</p>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-6 mt-20 pt-10 border-t border-slate-800 text-center text-xs tracking-[0.3em] opacity-40 uppercase font-black">
                © {year} DORI & RITO HAPPYDAYS. ALL RIGHTS RESERVED.
                <div className="mt-4 flex justify-center gap-4 lowercase tracking-normal font-normal">
                    <Link href="/privacy" className="hover:text-white transition-colors">隱私權政策</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">服務條款</Link>
                </div>
            </div>
        </footer>
    );
}
