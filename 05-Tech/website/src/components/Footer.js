import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { NAV_LINKS } from '@/lib/nav';
import { BRAND } from '@/lib/constants';

export default function Footer() {
    const t = useTranslations('common.footer');
    const tNav = useTranslations('common.nav');
    const year = new Date().getFullYear();

    return (
        <footer className="py-20 bg-slate-900 text-slate-400 mt-auto">
            <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center md:text-left">
                <div className="md:col-span-2">
                    <div className="flex items-center justify-center md:justify-start">
                        <img src="https://iili.io/qf6QsVe.png" alt="Eric & Pennee Logo" className="h-14 brightness-0 invert opacity-80 mb-8" />
                    </div>
                    <p className="max-w-xs mx-auto md:mx-0 font-medium leading-relaxed">{t('tagline')}</p>
                </div>
                <div>
                    <h5 className="text-white font-black mb-8 text-lg tracking-widest">{t('quickLinks')}</h5>
                    <ul className="space-y-4 font-bold">
                        {NAV_LINKS.filter(l => l.key !== 'about').map(link => (
                            <li key={link.href}>
                                <Link href={link.href} className="hover:text-brand-orange transition-colors">
                                    {tNav(link.key)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h5 className="text-white font-black mb-8 text-lg tracking-widest">{t('followUs')}</h5>
                    <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-slate-800 hover:bg-brand-orange hover:text-white px-8 py-4 rounded-3xl transition-all group mx-auto md:mx-0">
                        <img src="/images/ig-logo.png" alt="Instagram" className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                    </a>
                    <div className="mt-10 space-y-2">
                        <p className="text-sm">✉️ {BRAND.email}</p>
                        <p className="text-sm">{t('location')}</p>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-6 mt-20 pt-10 border-t border-slate-800 text-center text-xs tracking-[0.3em] opacity-40 uppercase font-black">
                {t('copyright', { year })}
                <div className="mt-4 flex justify-center gap-4 lowercase tracking-normal font-normal">
                    <Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
                </div>
            </div>
        </footer>
    );
}
